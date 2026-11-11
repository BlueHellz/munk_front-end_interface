"""Strict PNG, manifest, preserved-file and ZIP verification. No application access."""
import argparse, hashlib, json, pathlib, struct, zipfile, zlib

def sha(data): return hashlib.sha256(data).hexdigest()
def metadata(path): return any(p in ('__MACOSX','.DS_Store','.AppleDouble') or p.startswith('._') for p in pathlib.PurePosixPath(path).parts)
def png(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG signature'
    pos, compressed, dimensions, ended = 8, bytearray(), None, False
    while pos < len(data):
        length = struct.unpack('>I',data[pos:pos+4])[0]
        kind = data[pos+4:pos+8]; chunk = data[pos+8:pos+8+length]
        crc = struct.unpack('>I',data[pos+8+length:pos+12+length])[0]
        assert zlib.crc32(kind+chunk)&0xffffffff == crc, 'PNG chunk CRC mismatch'
        if kind == b'IHDR': dimensions = struct.unpack('>IIBBBBB',chunk)
        if kind == b'IDAT': compressed.extend(chunk)
        pos += length+12
        if kind == b'IEND': ended=True;break
    assert ended and pos==len(data) and dimensions, 'Incomplete PNG'
    width,height,bits,color,compression,filtering,interlace = dimensions
    assert width>0 and height>0 and bits==8 and color in (2,6) and interlace==0, 'Unsupported PNG encoding'
    channels={2:3,6:4}[color]
    raw=zlib.decompress(compressed)
    assert len(raw)==height*(1+width*channels), 'PNG pixel stream size mismatch'
    assert all(raw[y*(1+width*channels)]<=4 for y in range(height)), 'Invalid PNG filter'
    return {'width':width,'height':height,'bytes':len(data),'sha256':sha(data)}

def verify_folder(folder):
    manifest=json.loads((folder/'screenshot-manifest.json').read_text())
    entries=manifest['entries'];assert manifest['expected']==72 and len(entries)==72
    assert len({e['filename'] for e in entries})==72
    assert manifest['successful']==72 and all(e['status']=='SUCCESS' for e in entries), 'Incomplete review; ZIP refused'
    found={p.name for p in (folder/'screenshots').glob('*.png')}
    assert found=={e['filename'] for e in entries}, 'Screenshot set differs from manifest'
    captures=[];scopes={};preserved=0
    for e in entries:
        data=(folder/'screenshots'/e['filename']).read_bytes();info=png(data)
        assert info['sha256']==e['sha256'] and info['bytes']==e['bytes'], e['filename']+' hash mismatch'
        assert info['width']==e['viewport']['width'], e['filename']+' viewport mismatch'
        assert e['expectedViewVerified'] and e['authScope'] in ('real-guest','authenticated-fixture')
        if e.get('preservedFrom'):
            assert e['sha256']==e['preservedFrom']['sha256'];preserved+=1
        scopes[e['authScope']]=scopes.get(e['authScope'],0)+1
        captures.append({'filename':e['filename'],**info})
    return {'status':'PASS','pngCount':72,'preservedCount':preserved,'scopes':scopes,'pngVerification':'PNG signature, every chunk CRC, complete IDAT decompression, dimensions and SHA-256','captures':captures}

p=argparse.ArgumentParser();p.add_argument('folder');p.add_argument('--zip',action='store_true');a=p.parse_args();folder=pathlib.Path(a.folder).resolve()
result=verify_folder(folder)
if not a.zip:
    (folder/'png-verification.json').write_text(json.dumps(result,indent=2)+'\n')
else:
    files=[f for f in sorted(folder.rglob('*')) if f.is_file() and not metadata(f.relative_to(folder).as_posix()) and not f.name.endswith(('.zip','.zip.verification.json'))]
    archive=folder/'MUNK-CURRENT-STATE-REVIEW.zip'
    assert not archive.exists(), 'Will not overwrite an existing archive'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for f in files: z.write(f,f.relative_to(folder).as_posix())
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, 'ZIP CRC validation failed'
        names=z.namelist();assert len(names)==len(set(names)) and not any(metadata(n) for n in names)
        assert sum(n.endswith('.png') for n in names)==72
        for f in files:
            name=f.relative_to(folder).as_posix();assert z.read(name)==f.read_bytes(), 'ZIP content differs: '+name
        manifest=json.loads(z.read('screenshot-manifest.json'));assert manifest['successful']==72
    result={k:v for k,v in result.items() if k!='captures'}
    result.update({'archive':str(archive),'archiveSha256':sha(archive.read_bytes()),'fileCount':len(files),'metadataEntries':0,'allArchivedFilesMatchDisk':True})
    pathlib.Path(str(archive)+'.verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='captures'}))
