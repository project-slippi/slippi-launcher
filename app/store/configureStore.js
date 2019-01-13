import configureStoreDev from './configureStore.dev';
import configureStoreProd from './configureStore.prod';

const isProd = process.env.NODE_ENV === 'production';
const selectedConfigureStore = isProd ? configureStoreProd : configureStoreDev;

export const { configureStore } = selectedConfigureStore;

export const { history } = selectedConfigureStore;
