const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;

export function profileIdFromGroupProfileUrl(url: string): number {    
    const matches = url.match(GROUP_PROFILE_LINK_REGEX);
    if (matches) {
        return parseInt(matches[1]);
    }
    else {
        return Number.NaN;
    }
}