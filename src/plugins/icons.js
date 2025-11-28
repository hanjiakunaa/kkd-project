import { addIcons, OhVueIcon } from 'oh-vue-icons'
import {
  BiCardList,
  BiClipboard2Data,
  BiCodeSlash,
  BiDownload,
  BiLayoutTextSidebarReverse,
  BiPersonVideo2, // video icon
  BiPostage,
  BiTable,
  BiViewList,
  FaBookmark, // 书签
  FaBrain,
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
  FcWorkflow,
  HiSolidViewList,
  HiTemplate,
  LaBlogger,
  LaSearchMinusSolid,
  LaSearchPlusSolid,
  MdClose,
  MdLoop,
  MdMorevert,
  PiGastly, // logo
  PrCloudUpload, // 云上传
  PxPixelarticons,
  SiOpenai,
  ViFileTypeAppsemble,
  ViFileTypeExcel, // excel
  ViFileTypePdf2, // prd
  ViFileTypeVscode,
  ViFileTypeWord, // word icon

} from 'oh-vue-icons/icons'
import {
  RiAddCircleLine,
  RiAppsLine,
  RiCloudLine,
  RiCodeBoxLine,
  RiComputerLine,
  RiDatabaseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiFileLine,
  RiFilmLine,
  RiFocusLine,
  RiFolderLine,
  RiFullscreenExitLine,
  RiGitBranchLine,
  RiGlobalLine,
  RiImageLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiMergeCellsHorizontal,
  RiMoonLine,
  RiPlayCircleLine,
  RiQqLine,
  RiRobotLine,
  RiScanLine,
  RiSearchLine,
  RiSettings3Line,
  RiStarLine,
  RiText,
  RiToolsLine,
  RiUploadLine,
  RiVideoLine,
  RiVolumeUpLine,

} from 'oh-vue-icons/icons/ri'

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
  FcWorkflow,
  // Workflow page specific icons (Remix)
  RiAddCircleLine,
  RiAppsLine,
  FaBrain,
  RiCloudLine,
  RiCodeBoxLine,
  RiComputerLine,
  RiDatabaseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiFileLine,
  RiFilmLine,
  RiFocusLine,
  RiFolderLine,
  RiFullscreenExitLine,
  RiGitBranchLine,
  RiGlobalLine,
  RiImageLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  MdLoop,
  RiMergeCellsHorizontal,
  RiMoonLine,
  RiPlayCircleLine,
  RiQqLine,
  RiRobotLine,
  RiScanLine,
  RiSearchLine,
  RiSettings3Line,
  RiStarLine,
  RiText,
  RiToolsLine,
  RiUploadLine,
  RiVideoLine,
  RiVolumeUpLine,
  BiTable,
  BiPersonVideo2,
  BiViewList,
  SiOpenai,
  HiTemplate,

)

export const conponentIconPlugins = {
  install: (app) => {
    app.component('h-icon', OhVueIcon)
    app.component('v-icon', OhVueIcon)
  },
}

// 导出图标组件供其他地方使用
export { OhVueIcon }
