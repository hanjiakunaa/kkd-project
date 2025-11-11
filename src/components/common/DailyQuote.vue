<template>
  <div class="daily-quote" :class="{ 'is-loading': loading }">
    <n-tooltip trigger="hover" placement="bottom">
      <template #trigger>
        <div class="daily-quote__content">
          <n-spin :show="loading" size="small">
            <span v-if="!errorText" class="daily-quote__text">
              {{ sentenceText || '加载名句中…' }}
            </span>
            <!-- <span v-else class="daily-quote__error">{{ errorText }}</span> -->
          </n-spin>
          <!-- <span v-if="!loading && originText" class="daily-quote__origin">
            {{ originText }}
          </span> -->
        </div>
      </template>
      <div class="daily-quote__tooltip">
        <p class="daily-quote__tooltip-line">
          {{ sentenceText || '加载名句中…' }}
        </p>
        <!-- <p v-if="originText" class="daily-quote__tooltip-line">
          {{ originText }}
        </p> -->
      </div>
    </n-tooltip>

    <button
      class="daily-quote__refresh"
      :title="loading ? '正在刷新…' : '刷新每日一言'"
      :disabled="loading"
      type="button"
      @click="handleRefresh"
    >
      <i v-if="loading" class="i-line-md:loading-twotone-loop daily-quote__refresh-icon bg-primary" />
      <i v-else class="i-carbon-renew daily-quote__refresh-icon bg-primary" />
    </button>
  </div>
</template>

<script setup>
import { load as loadSentence } from 'jinrishici'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const sentenceText = ref('')
const originText = ref('')
const errorText = ref('')
const loading = ref(false)
let disposed = false

function updateSentence(result) {
  if (disposed)
    return
  const data = result?.data ?? {}
  sentenceText.value = data?.content ?? ''
  const origin = data?.origin ?? {}
  const dynasty = origin.dynasty ? `${origin.dynasty}` : ''
  const author = origin.author ? `${origin.author}` : ''
  //   const title = origin.title ? `《${origin.title}》` : ''
  //   const parts = [dynasty, author, title].filter(Boolean)
  const parts = [dynasty, author].filter(Boolean)
  originText.value = parts.length ? `${parts.join(' · ')}` : ''
  errorText.value = ''
  loading.value = false
}

function handleError(err) {
  if (disposed)
    return
  const message = err?.errMessage || err?.message || '加载失败，请稍后重试'
  errorText.value = message
  loading.value = false
  console.error('[DailyQuote] 加载失败：', err)
}

function fetchSentence() {
  loading.value = true
  loadSentence(updateSentence, handleError)
}

function handleRefresh() {
  if (!loading.value)
    fetchSentence()
}

onMounted(() => {
  fetchSentence()
})

onBeforeUnmount(() => {
  disposed = true
})
</script>

<style scoped>
.daily-quote {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 560px;
  min-width: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.08);
  transition: background-color 0.2s ease;
  color: inherit;
  text-align: center;
}

.daily-quote:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.is-loading {
  opacity: 0.86;
}

.daily-quote__content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
  color: inherit;
}

.daily-quote__text,
.daily-quote__error {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: normal;
}

.daily-quote__error {
  color: var(--error-color, #ff6666);
}

.daily-quote__origin {
  margin-top: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  opacity: 0.75;
  font-size: 13px;
}

.daily-quote__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.daily-quote__refresh:hover:not(:disabled) {
  transform: rotate(-12deg);
}

.daily-quote__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.daily-quote__refresh-icon {
  font-size: 14px;
}

.daily-quote__tooltip {
  max-width: 320px;
  font-size: 13px;
  line-height: 1.5;
}

.daily-quote__tooltip-line + .daily-quote__tooltip-line {
  margin-top: 4px;
}
</style>
