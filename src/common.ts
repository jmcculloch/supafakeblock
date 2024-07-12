const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;

/**
 * Parses a Facebook group profile link and extracts the profile ID
 *
 * @param url a relative URL composed of the numeric group and profile IDs (and sometimes some other query string information)
 * @returns number
 */
export function profileIdFromGroupProfileUrl(url: string): number {    
    const matches = url.match(GROUP_PROFILE_LINK_REGEX);
    if (matches) {
        return parseInt(matches[1]);
    }
    else {
        return Number.NaN;
    }
}

/**
 * Lookup the current user's Facebook profile ID
 *
 * @returns number | null
 */
function getFacebookUserId(): number | null{
    const matches = document.getElementById('__eqmc')?.textContent?.match(/.*__user=(\d+)/);

    return matches ? parseInt(matches[1]) : null;
}