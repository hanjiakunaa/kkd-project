<template>
  <div class="excel-preview">
    <div id="luckysheet" class="luckysheet-wrap" />
  </div>
</template>

<script setup>
import LuckyExcel from 'luckyexcel'
import { useRoute } from 'vue-router'

const route = useRoute()
function initXlsx(data) {
  LuckyExcel.transformExcelToLucky(data, (exportJson, luckysheetfile) => {
    if (
      !exportJson
      || exportJson.sheets == null
      || exportJson.sheets.length == 0
    ) {
      return
    }

    if (window.luckysheet) {
      window.luckysheet.destroy()
    }

    window.luckysheet.create({
      data: exportJson.sheets,
      userInfo: exportJson.info?.creator,
      container: 'luckysheet', // 设定DOM容器的id
      showtoolbar: false, // 是否显示工具栏
      showinfobar: false, // 是否显示顶部信息栏
      showstatisticBar: false, // 是否显示底部计数栏
      sheetBottomConfig: false, // sheet页下方的添加行按钮和回到顶部按钮配置
      allowEdit: false, // 是否允许前台编辑
      enableAddRow: false, // 是否允许增加行
      enableAddCol: false, // 是否允许增加列
      sheetFormulaBar: false, // 是否显示公式栏
      enableAddBackTop: false, // 返回头部按钮
      showsheetbar: false, // 是否显示底部sheet页按钮
      showsheetbarConfig: {
        add: false,
        menu: false,
      },
    })
  })
}

watch(
  () => route.query.file,
  (val) => {
    initXlsx(val.objectUrl)
  },
)
</script>

<style scoped>
.excel-preview {
  width: 100%;
  height: 1000%;
}

.luckysheet-wrap {
  width: 100%;
  height: 90vh;
}

#luckysheet {
  height: 100%;
  width: 100%;
}
</style>
