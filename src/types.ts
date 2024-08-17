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
    // TODO: number (string used for ease of mantine/react form input or floating point precision?)
    confidence: string,
    notes?: string,
    dispute?: boolean,
    // TODO: having de/serialization issues with Date, using string for now
    createdAt?: string,
}

export interface PromptRequest {
    profileId: number,
    upVotes: number,
    downVotes: number,
    avgConfidence: number,
    reports?: Report[]
}

// TODO: this is getting overloaded, e.g. optional up/down votes
export interface ReportStats {
    type: string,
    upVotes?: number,
    downVotes?: number,
    avgConfidence: number
}

export enum Command {
    // background->extension
    Prompt = "PROMPT",
    Notification = "NOTIFICATION",
    SignInRequired = "SIGN_IN_REQUIRED",
    Detection = "DETECTION",
    UpdateProfile = "UPDATE_PROFILE",
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
