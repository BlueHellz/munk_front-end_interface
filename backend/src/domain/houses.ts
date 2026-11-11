import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { HouseDraftInput, HouseDraftPatch } from '../../../contracts/src/foundation.js';
import {createDemoHouse} from './demo-houses.js';
import type { HouseRecord,DemoHouseInput,ProductMode } from '../../../contracts/src/creator.js';
import { activeAccount, memberHouse, type Actor, type HouseRow } from './access.js';
import { transaction } from '../db/transaction.js';
import { DomainError, conflict, invalid } from '../api/errors.js';

export const houseView = (h: HouseRow): HouseRecord => ({ membershipRole: h.membership_role, id: h.id, address: h.address, name: h.name, description: h.description, publicName: h.public_name, focus: h.focus, version: h.version, admissionRevision: h.admission_revision, admissionStatus: h.admission_status,demoReady:h.demo_ready===true });
function validate(input: Omit<HouseDraftInput, 'address'>) {
  for (const [value, max] of [[input.name, 120], [input.description, 4000], [input.publicName, 80], [input.focus, 120]] as const) {
    if (typeof value !== 'string' || [...value].length > max) invalid('House fields exceed their allowed length.');
  }
}
export class Houses {
  constructor(private pool: Pool,readonly mode:ProductMode='strict') {}
  async createDemo(actor:Actor,input:DemoHouseInput,key:string){
    if(this.mode!=='demo')throw new DomainError(403,'forbidden','Demo House creation is disabled in strict mode.');
    return houseView(await createDemoHouse(this.pool,actor,input,key));
  }
  async create(actor: Actor, input: HouseDraftInput, requestKey: string): Promise<HouseRecord> {
    validate(input);
    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(input.address)) throw new DomainError(422,'validation','Choose a valid House address.',{address:'Use 3–40 lowercase letters, numbers or hyphens; start and end with a letter or number. Example: mountain-studio.'});
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) invalid('A UUID idempotency key is required.');
    const fingerprint = createHash('sha256').update(JSON.stringify([input.address, input.name, input.description, input.publicName, input.focus])).digest('hex');
    try {
      return await transaction(this.pool, async client => {
        await activeAccount(client, actor);
        // Serializes same-account creates, making idempotent retry atomic.
        await client.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE', [actor.accountId]);
        const prior = await client.query("SELECT * FROM creation_requests WHERE account_id=$1 AND operation='house' AND request_key=$2", [actor.accountId, requestKey]);
        if (prior.rows[0]) {
          if (prior.rows[0].fingerprint !== fingerprint) conflict('Idempotency key was already used with different input.');
          return houseView(await memberHouse(client, actor, prior.rows[0].resource_id, true));
        }
        const id = randomUUID();
        const result = await client.query<HouseRow>(`INSERT INTO houses (id,address,name,description,public_name,focus,founder_account_id,operator_account_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`, [id, input.address, input.name, input.description, input.publicName, input.focus, actor.accountId]);
        await client.query("INSERT INTO house_memberships (house_id,account_id,role) VALUES ($1,$2,'owner')", [id, actor.accountId]);
        await client.query("INSERT INTO creation_requests (account_id,operation,request_key,fingerprint,resource_id) VALUES ($1,'house',$2,$3,$4)", [actor.accountId, requestKey, fingerprint, id]);
        return houseView({...result.rows[0], membership_role: 'owner'});
      });
    } catch (error) {
      if ((error as {code?: string}).code === '23505') throw new DomainError(409,'conflict','House address is already reserved.',{address:'This address is reserved or already taken. Choose another address.'});
      throw error;
    }
  }
  async list(actor: Actor): Promise<HouseRecord[]> {
    return transaction(this.pool, async client => {
      await activeAccount(client, actor);
      const rows = await client.query<HouseRow>('SELECT h.*, m.role AS membership_role FROM houses h JOIN house_memberships m ON m.house_id=h.id WHERE m.account_id=$1 ORDER BY h.created_at,h.id', [actor.accountId]);
      return rows.rows.map(houseView);
    });
  }
  async get(actor: Actor, id: string) { return transaction(this.pool, async client => houseView(await memberHouse(client, actor, id))); }
  async update(actor: Actor, id: string, input: HouseDraftPatch & {address?:string}) {
    validate(input);
    return transaction(this.pool, async client => {
      const h = await memberHouse(client, actor, id, true);
      if (h.version !== input.version) conflict('House changed. Reload before saving.');
      if(input.address!==undefined&&input.address!==h.address&&(this.mode!=='demo'||!h.demo_ready))throw new DomainError(403,'forbidden','Address editing is available only for demo-ready Houses in Demo mode.');
      const address=input.address??h.address;
      if(this.mode==='demo'&&h.demo_ready)input={...input,name:input.name.trim()||'My demo House',publicName:input.publicName.trim()||'Demo creator'};
      const changed = h.address!==address || h.name !== input.name || h.description !== input.description || h.public_name !== input.publicName || h.focus !== input.focus;
      if (!changed) return houseView(h);
      const incrementRevision = h.admission_status !== 'draft';
      const result = await client.query<HouseRow>(`UPDATE houses SET name=$2,description=$3,public_name=$4,focus=$5,
        address=$7,version=version+1,admission_revision=admission_revision+$6,admission_status='draft',updated_at=now() WHERE id=$1 RETURNING *`,
      [id, input.name, input.description, input.publicName, input.focus, incrementRevision ? 1 : 0,address]);
      return houseView({...result.rows[0], membership_role: 'owner'});
    }).catch(error=>{if((error as {code?:string}).code==='23505')throw new DomainError(409,'conflict','House address is reserved.',{address:'This address is already taken or reserved. Choose another address.'});throw error;});
  }
}
