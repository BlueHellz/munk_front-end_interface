export type ThemeMode='dark'|'light';
export type AppearancePreference={theme:ThemeMode;explicit:boolean;updatedAt:string|null};
export const isAppearancePreference=(v:unknown):v is AppearancePreference=>!!v&&typeof v==='object'&&'theme'in v&&['dark','light'].includes(v.theme as string)&&'explicit'in v&&typeof v.explicit==='boolean'&&'updatedAt'in v&&(v.updatedAt===null||typeof v.updatedAt==='string');
export const appearanceInputSchema={type:'object',additionalProperties:false,required:['theme'],properties:{theme:{type:'string',enum:['dark','light']}}};
