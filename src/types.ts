export enum ReportType {
    SCAMMER = 'SCAMMER',
    SPAMMER = 'SPAMMER',
    FAKE_PROFILE = 'FAKE_PROFILE',
}

export enum ReportConfidence {
    NOT_SURE = '0.25',
    MEH = '0.5',
    PROBABLY = '0.75',
    ABSOLUTELY = '1.0'
}

export interface Report {
    profileId: number,
    type: string,
    confidence: number,
    notes?: string,
    reporter?: number,
    dispute?: boolean,
}

export interface ReportStats {
    upVotes: number,
    downVotes: number,
    avgConfidence: number
}

export enum Command {
    Prompt = "PROMPT",
    Report = "REPORT",
    IsBlacklisted = "IS_BLACKLISTED",
    GetReportStats = "GET_REPORT_STATS",
    BlacklistCount = "BLACKLIST_COUNT"
}

export interface Message {
    command: Command,
    body: number | Report
}
