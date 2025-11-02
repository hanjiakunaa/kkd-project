import { addIcons, OhVueIcon } from 'oh-vue-icons'
import {
  FaBookmark, // 书签
  FaCloudUploadAlt, // 上传
  FaCompress, // 退出全屏
  FaExchangeAlt, // 切换
  FaExpand, // 全屏
  FaExternalLinkAlt, // 外链
  FaFlask, // 实验/演示
  FaHome, // 首页
  FaList, // 列表/资源
  FaMinus, // 减少
  FaPalette, // 调色板
  FaPlus, // 增加
  FaShieldAlt, // 权限管理
  FaSignOutAlt, // 退出
  FaStar, // 星标
  FaSyncAlt, // 刷新
  FaThLarge, // 基础功能/应用
  FaTimes, // 关闭
  FaUser, // 用户/个人
  FaUsers, // 角色/多用户
  FcHome, // 首页
  PiGastly, // logo
} from 'oh-vue-icons/icons'

addIcons(
  FcHome,
  FaBookmark,
  FaCloudUploadAlt,
  FaCompress,
  FaExchangeAlt,
  FaExpand,
  FaExternalLinkAlt,
  FaFlask,
  FaHome,
  FaList,
  FaMinus,
  FaPalette,
  FaPlus,
  FaShieldAlt,
  FaSignOutAlt,
  FaStar,
  FaSyncAlt,
  FaThLarge,
  FaTimes,
  FaUser,
  FaUsers,
  PiGastly,
)

export const conponentIconPlugins = {
  install: (app) => {
    app.component('h-icon', OhVueIcon)
    app.component('v-icon', OhVueIcon)
  },
}

// 导出图标组件供其他地方使用
export { OhVueIcon }
