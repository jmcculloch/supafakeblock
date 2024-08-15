import md5 from 'crypto-js/hmac-md5';

export async function imageToMD5(img: HTMLImageElement): Promise<string> {

    const response = await fetch(img.src, {
        cache: 'only-if-cached',
        mode: 'same-origin'
    });
    const blob = await response.blob();
    // TODO: whatever byte/words crpyto-js/md5 accepts
    return md5(await blob.text(), 'key').toString();
}