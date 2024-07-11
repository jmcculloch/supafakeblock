export enum ScammerType {
    SCAMMER,
    SPAMMER,
    FAKE_PROFILE
};

export interface Scammer {
    profileId: number,
    type?: ScammerType,
    notes?: string | undefined,
    confidence?: number,
};
