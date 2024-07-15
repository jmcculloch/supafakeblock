export enum ReportType {
    SCAMMER = 'SCAMMER',
    SPAMMER = 'SPAMMER',
    FAKE_PROFILE = 'FAKE_PROFILE',
}

export interface Report {
    profileId: number,
    type: string,
    confidence: number,
    notes?: string,
    reporter?: number
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
    GetReportStats = "GET_REPORT_STATS"
}

export interface Message {
    command: Command,
    body: number | Report
}
