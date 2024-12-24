import {
    Font,
    getDefaultFont,
    DEFAULT_FONT_NAME,
  } from '@pdfme/common';
  
  const fontObjList = [
    {
      fallback: true,
      label: 'andalus',
      url: '/fonts/andalus.ttf',
    },
    {
      fallback: false,
      label: "algerian-regular",
      url: "/fonts/algerian-regular.ttf"
    },
    {
      fallback: false,
      label: DEFAULT_FONT_NAME,
      data: getDefaultFont()[DEFAULT_FONT_NAME].data,
    },
  ];
  
  export const getFontsData = async (): Promise<Font> => {
    const fontDataList = (await Promise.all(
      fontObjList.map(async (font) => ({
        ...font,
        data: font.data || (await fetch(font.url || '').then((res) => res.arrayBuffer())),
      }))
    )) as { fallback: boolean; label: string; data: ArrayBuffer }[];
  
    return fontDataList.reduce((acc, font) => ({ ...acc, [font.label]: font }), {} as Font);
  };
  
  