import { PLUGIN_IMPORTS } from '../../../../config/plugins';

export type PageType = 'persistent' | 'overlay' | 'page';

export type PageNames = keyof typeof PLUGIN_IMPORTS;
