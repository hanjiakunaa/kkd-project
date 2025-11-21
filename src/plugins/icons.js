import { addIcons, OhVueIcon } from 'oh-vue-icons'
import {
  BiCardList,
  BiClipboard2Data,
  BiCodeSlash,
  BiDownload,
  BiLayoutTextSidebarReverse,
  BiPostage,
  FaBookmark, // 书签
  FaCompress, // 退出全屏
  FaExchangeAlt, // 切换
  FaExpand, // 全屏
  FaExternalLinkAlt, // 外链
  FaFlask, // 实验/演示
  FaHome, // 首页
  FaImages,
  FaList, // 列表/资源
  FaMinus, // 减少
  FaPalette, // 调色板
  FaPlus, // 增加
  FaRegularKeyboard,
  FaShieldAlt, // 权限管理
  FaSignOutAlt, // 退出
  FaStar, // 星标
  FaSyncAlt, // 刷新
  FaThLarge, // 基础功能/应用
  FaTimes, // 关闭
  FaUser, // 用户/个人
  FaUsers, // 角色/多用户
  FcHome, // 首页
  FcSearch,
  HiSolidViewList,
  LaBlogger,
  LaSearchMinusSolid,
  LaSearchPlusSolid,
  MdClose,
  MdMorevert,
  PiGastly, // logo
  PrCloudUpload, // 云上传
  PxPixelarticons,
  ViFileTypeAppsemble,
  ViFileTypeExcel, // excel
  ViFileTypePdf2, // prd
  ViFileTypeVscode,
  ViFileTypeWord, // word icon
} from 'oh-vue-icons/icons'

addIcons(
  FcHome,
  FaBookmark,
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
  PrCloudUpload,
  ViFileTypeVscode,
  MdMorevert,
  MdClose,
  BiCodeSlash,
  BiDownload,
  BiCardList,
  BiLayoutTextSidebarReverse,
  PxPixelarticons,
  ViFileTypeAppsemble,
  ViFileTypeWord, // word icon
  ViFileTypePdf2, // prd
  ViFileTypeExcel, // excel
  BiClipboard2Data,
  LaSearchMinusSolid,
  LaSearchPlusSolid,
  FaImages,
  BiPostage,
  FcSearch,
  HiSolidViewList,
  LaBlogger,
  FaRegularKeyboard,

)

export const conponentIconPlugins = {
  install: (app) => {
    app.component('h-icon', OhVueIcon)
    app.component('v-icon', OhVueIcon)
  },
}

// 导出图标组件供其他地方使用
export { OhVueIcon }
