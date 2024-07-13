export enum ScammerType {
    SCAMMER = 'Scammer',
    SPAMMER = 'Spammer',
    FAKE_PROFILE = 'Fake Profile',
    UNKNOWN = 'Unknown'
}

export interface Scammer {
    profileId: number,
    type: string,
    confidence: number,
    notes?: string | undefined
}

export enum Command {
    Prompt,
    Report,
    Query
}

export interface Message {
    command: Command,
    body: QueryRequest| PromptRequest | ReportRequest
}

export interface QueryRequest {
    profileId: number
}

export interface PromptRequest {
    profileId: number
}

export interface ReportRequest {
    profileId: number,
    type: string,
    confidence: number,
    notes: string | null
}
