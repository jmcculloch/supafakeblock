import { User } from "@supabase/supabase-js"

export enum ReportType {
    SCAMMER = 'SCAMMER',
    SPAMMER = 'SPAMMER',
    FAKE_PROFILE = 'FAKE_PROFILE',
    WATCH = 'WATCH',
    UNKNOWN = 'UNKNOWN'
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
    confidence: string,
    notes?: string,
    dispute?: boolean,
}

export interface PromptRequest {
    profileId: number,
    upVotes: number,
    downVotes: number,
    avgConfidence: number
}

// TODO: number/string types, and this is getting overloaded, e.g. optional up/down votes
export interface ReportStats {
    type: string,
    upVotes?: number,
    downVotes?: number,
    avgConfidence: string
}

export enum Command {
    // background->extension
    Prompt = "PROMPT",
    Notification = "NOTIFICATION",
    SignInRequired = "SIGN_IN_REQUIRED",
    Detection = "DETECTION",
    // extension->background
    Report = "REPORT",
    Watch = "WATCH",
    Delete = "DELETE",
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
