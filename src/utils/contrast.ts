export function getReadableTextColour(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0,2),16) / 255;
    const g = parseInt(hex.substring(2,4),16) / 255;
    const b = parseInt(hex.substring(4,6),16) / 255;

    const linear = (c:number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

    return luminance > 0.45 ? '#23282D' : '#FFFFFF';
}