<template>
  <common-page :show-header="false" :show-footer="false">
    <div class="video-bg-demo">
      <!-- 视频背景演示 -->
      <video-background
        ref="videoBackgroundRef"
        :src="videoSrc"
        :poster="posterSrc"
        :sources="videoSources"
        overlay="linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(30, 60, 114, 0.4) 50%, rgba(0, 0, 0, 0.6) 100%)"
        height="100vh"
        object-fit="cover"
        :autoplay="true"
        :loop="true"
        :muted="true"
        @ready="onVideoReady"
        @playing="onVideoPlaying"
      >
        <!-- 视频上的内容 -->
        <div class="video-content">
          <!-- 主标题打字机效果 -->
          <h1 class="video-title">
            <type-writer
              :text="titleTexts"
              :type-speed="120"
              :delete-speed="60"
              :pause-delay="3000"
              :start-delay="800"
              :loop="true"
              cursor="|"
              cursor-color="#00d4ff"
            />
          </h1>

          <!-- 副标题打字机效果 -->
          <p class="video-subtitle">
            <type-writer
              :text="subtitleText"
              :type-speed="50"
              :start-delay="1500"
              :loop="false"
              :show-cursor="false"
            />
          </p>

          <!-- 动态标签 -->
          <div class="video-tags">
            <span v-for="(tag, index) in tags" :key="index" class="tag" :style="{ animationDelay: `${index * 0.2 + 2}s` }">
              {{ tag }}
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="video-actions">
            <button class="btn-primary" @click="scrollToContent">
              <span class="btn-text">开始探索</span>
              <span class="btn-icon">→</span>
            </button>
            <button class="btn-secondary" @click="toggleVideo">
              <span>{{ isPlaying ? '暂停视频' : '播放视频' }}</span>
            </button>
          </div>

          <!-- 滚动提示 -->
          <div class="scroll-indicator">
            <div class="mouse">
              <div class="wheel" />
            </div>
            <span>向下滚动</span>
          </div>
        </div>
      </video-background>

      <!-- 控制面板 -->
      <div id="content-section" class="control-panel">
        <common-page :show-header="false" :show-footer="false">
          <div class="demo-section">
            <h3 class="section-title">
              组件特性
            </h3>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">
                  📱
                </div>
                <h4>响应式设计</h4>
                <p>自动根据屏幕尺寸切换不同分辨率的视频源</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  ⌨️
                </div>
                <h4>打字机效果</h4>
                <p>支持多段文字循环打字、删除动画效果</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  🎨
                </div>
                <h4>自定义遮罩</h4>
                <p>支持渐变色、纯色等多种遮罩样式</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  ⚡
                </div>
                <h4>性能优化</h4>
                <p>预加载、懒加载策略，流畅播放体验</p>
              </div>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="section-title">
              使用示例
            </h3>
            <code-editor
              v-model="codeExample"
              language="vue"
              :readonly="true"
              height="400px"
              :show-toolbar="false"
            />
          </div>

          <div class="demo-section">
            <h3 class="section-title">
              组件参数
            </h3>
            <n-table :bordered="true" :single-line="false">
              <thead>
                <tr>
                  <th>参数</th>
                  <th>说明</th>
                  <th>类型</th>
                  <th>默认值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prop in propsTable" :key="prop.name">
                  <td><code>{{ prop.name }}</code></td>
                  <td>{{ prop.description }}</td>
                  <td><code>{{ prop.type }}</code></td>
                  <td><code>{{ prop.default }}</code></td>
                </tr>
              </tbody>
            </n-table>
          </div>
        </common-page>
      </div>
    </div>
  </common-page>
</template>

<script setup>
import { ref } from 'vue'
import video1 from '@/assets/video/1.mp4'
import powerHeroDesktop from '@/assets/video/accessories-hero-desktop.mp4'
import powerHeroMobile from '@/assets/video/power-hero-mobile.mp4'
import { TypeWriter, VideoBackground } from '@/components'
// 视频配置
const videoSrc = ref(video1)
const posterSrc = ref('')

// 响应式视频源配置
const videoSources = ref([
  {
    src: powerHeroMobile,
    res: 768,
    autoplay: true,
  },
  {
    src: powerHeroDesktop,
    res: 1200,
    autoplay: true,
  },
])

// 打字机文本配置
const titleTexts = ref([
  '🎬 响应式视频背景',
  '✨ 沉浸式用户体验',
  '🚀 高性能视频播放',
  '💡 简单易用的 API',
])

const subtitleText = ref('打造精美的视频背景效果，支持多分辨率自适应、打字机动画、自定义遮罩层等功能')

// 标签
const tags = ref(['Vue 3', '响应式', '打字机效果', '可定制'])

// 播放状态
const isPlaying = ref(true)
const videoBackgroundRef = ref(null)

// 视频事件
function onVideoReady() {
  // Video is ready
}

function onVideoPlaying() {
  isPlaying.value = true
}

// 控制方法
function toggleVideo() {
  if (videoBackgroundRef.value) {
    if (isPlaying.value) {
      videoBackgroundRef.value.player.pause()
      isPlaying.value = false
    }
    else {
      videoBackgroundRef.value.player.play()
      isPlaying.value = true
    }
  }
}

function scrollToContent() {
  document.getElementById('content-section')?.scrollIntoView({ behavior: 'smooth' })
}

// 代码示例
const codeExample = ref(`<template>
  <video-background
    src="/videos/background.mp4"
    poster="/images/poster.jpg"
    :sources="[
      { src: '/videos/mobile.mp4', res: 768, autoplay: true },
      { src: '/videos/tablet.mp4', res: 1200, autoplay: true }
    ]"
    overlay="linear-gradient(45deg, #2a4ae430, #fb949e6b)"
    height="100vh"
    :autoplay="true"
    :loop="true"
    :muted="true"
  >
    <h1>
      <type-writer
        :text="['欢迎来到我的网站', '探索无限可能']"
        :type-speed="100"
        :pause-delay="2000"
        :loop="true"
      />
    </h1>
  </video-background>
</template>`)

// Props 表格数据
const propsTable = ref([
  { name: 'src', description: '视频源地址（必填）', type: 'String', default: '-' },
  { name: 'poster', description: '封面图片地址', type: 'String', default: '""' },
  { name: 'sources', description: '响应式视频源配置', type: 'Array', default: '[]' },
  { name: 'autoplay', description: '是否自动播放', type: 'Boolean', default: 'true' },
  { name: 'loop', description: '是否循环播放', type: 'Boolean', default: 'true' },
  { name: 'muted', description: '是否静音', type: 'Boolean', default: 'true' },
  { name: 'overlay', description: '遮罩层样式（支持渐变）', type: 'String', default: '""' },
  { name: 'objectFit', description: '视频填充方式', type: 'String', default: '"cover"' },
  { name: 'height', description: '容器高度', type: 'String', default: '"100vh"' },
  { name: 'playbackRate', description: '播放速率', type: 'Number', default: '1.0' },
])
</script>

<style scoped>
.video-bg-demo {
  width: 100%;
  min-height: 100vh;
}

/* 视频内容样式 */
.video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  padding: 20px;
  height: 100%;
}

.video-title {
  font-family: 'Playfair Display', 'Noto Serif SC', serif;
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05em;
  min-height: 1.2em;
}

.video-subtitle {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 300;
  max-width: 600px;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.8;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  min-height: 3em;
}

/* 标签样式 */
.video-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.tag {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
  transition: all 0.3s ease;
}

.tag:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 按钮样式 */
.video-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 3rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.5);
}

.btn-primary .btn-icon {
  transition: transform 0.3s ease;
}

.btn-primary:hover .btn-icon {
  transform: translateX(5px);
}

.btn-secondary {
  padding: 14px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 滚动提示 */
.scroll-indicator {
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0.7;
  animation: bounce 2s infinite;
}

.mouse {
  width: 26px;
  height: 42px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 15px;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.wheel {
  width: 4px;
  height: 10px;
  background: #fff;
  border-radius: 2px;
  animation: scroll 1.5s infinite;
}

@keyframes scroll {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(15px);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.scroll-indicator span {
  font-size: 0.75rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 控制面板 */
.control-panel {
  background: var(--n-color, #f5f6fb);
}

.demo-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--n-text-color, #333);
  position: relative;
  padding-left: 16px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  border-radius: 2px;
}

/* 特性卡片网格 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--n-card-color, #fff);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--n-border-color, #eee);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.feature-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--n-text-color, #333);
}

.feature-card p {
  font-size: 0.875rem;
  color: var(--n-text-color-3, #666);
  line-height: 1.6;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .video-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    max-width: 280px;
  }
}
</style>
