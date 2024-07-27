import { User } from "@supabase/supabase-js"

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

export interface PromptRequest {
    profileId: number,
    upVotes: number,
    downVotes: number,
    avgConfidence: number
}

export interface ReportStats {
    upVotes: number,
    downVotes: number,
    avgConfidence: string
}

export enum Command {
    // background->extension
    Prompt = "PROMPT",
    Notification = "NOTIFICATION",
    SignInRequired = "SIGN_IN_REQUIRED",
    // extension->background
    Report = "REPORT",
    IsBlacklisted = "IS_BLACKLISTED",
    BlacklistCount = "BLACKLIST_COUNT",
    GetUser = "GET_USER",
    SignIn = "SIGN_IN",
    SignOut = "SIGN_OUT"
}

export interface Message {
    command: Command,
    // TODO: refactor
    // TODO: abstract supabase-js User definition
    body: number | Report | PromptRequest | User
}
