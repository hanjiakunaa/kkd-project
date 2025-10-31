import { addIcons, OhVueIcon } from 'oh-vue-icons'
import {
  PiGastly, // logo
} from 'oh-vue-icons/icons'

addIcons(PiGastly)

export const conponentIconPlugins = {
  install: (app) => {
    app.component('h-icon', OhVueIcon)
  },
}
