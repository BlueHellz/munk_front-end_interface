import type { ContentDraft, HouseDraft, CreatorState } from './creator-model';
import type {ServiceResult,UploadReceipt} from '../../contracts/src';
export type {ServiceResult,UploadReceipt} from '../../contracts/src';
// Legacy publication/resume boundary. Real House/upload adapters live in server-creator.ts.
export {apiClient} from './api';
export interface CreatorDraftRepository {
    load(): {
        state: CreatorState;
        warning: string;
    };
    save(state: CreatorState): string;
}
export interface CreatorServices {
    checkAddress(address: string): Promise<ServiceResult<{
        available: boolean;
    }>>;
    submitAdmission(house: HouseDraft, intro: File, signal: AbortSignal): Promise<ServiceResult<{
        submissionId: string;
        identityStatus: 'pending';
        introductionStatus: 'pending';
    }>>;
    uploadVideo(content: ContentDraft, file: File, signal: AbortSignal): Promise<ServiceResult<UploadReceipt>>;
    getUpload(assetId: string, signal: AbortSignal): Promise<ServiceResult<UploadReceipt>>;
    resumeUpload(resumeToken: string, file: File, signal: AbortSignal): Promise<ServiceResult<UploadReceipt>>;
    publish(content: ContentDraft, signal: AbortSignal): Promise<ServiceResult<{
        id: string;
        publicUrl: string;
        status: 'published';
    }>>;
    unpublish(id: string, signal: AbortSignal): Promise<ServiceResult<{
        status: 'unpublished';
    }>>;
}
const unavailable = <T>(feature: string): Promise<ServiceResult<T>> => Promise.resolve({ ok: false, code: 'unavailable', message: `${feature} is not implemented by this adapter. Existing server uploads and House records are unchanged; no public work was created.`, retryable: false });
export const creatorServices: CreatorServices = { checkAddress: () => unavailable('Global address reservation'), submitAdmission: () => unavailable('Admission submission'), uploadVideo: () => unavailable('Server upload and processing'), getUpload: () => unavailable('Processing status'), resumeUpload: () => unavailable('Resumable transfer'), publish: () => unavailable('Server publishing'), unpublish: () => unavailable('Server unpublishing') };
