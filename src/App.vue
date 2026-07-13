<script setup>
import { ref, computed } from 'vue'
import { useConnection } from '@/stores/connection.js'
import { useMetadata } from '@/stores/metadata.js'
import { useQuery } from '@/stores/query.js'
import TopBar from '@/components/TopBar.vue'
import EntityBrowser from '@/components/EntityBrowser.vue'
import QueryBuilder from '@/components/QueryBuilder.vue'
import UrlPreview from '@/components/UrlPreview.vue'
import DataGrid from '@/components/DataGrid.vue'
import JsonViewer from '@/components/JsonViewer.vue'
import ResponseMeta from '@/components/ResponseMeta.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import SavedQueries from '@/components/SavedQueries.vue'

const { state: connState, openModal, getActive } = useConnection()
const { state: metaState } = useMetadata()
const { state: queryState } = useQuery()

// Sidebar tabs
const sidebarTab = ref('entities') // entities | history | saved

// Results tab
const resultsTab = ref('grid') // grid | json

const isConnected = computed(() => connState.status === 'connected')

function createSampleConnection() {
  openModal('add')
  const conn = getActive()
  if (conn) {
    conn.name = 'OData Sample'
    conn.url = 'https://services.odata.org/V4/OData/OData.svc/'
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-base text-ink overflow-hidden">
    <TopBar />

    <div class="flex-1 flex overflow-hidden">
      <!-- Left sidebar -->
      <aside class="w-72 border-r border-stroke flex flex-col shrink-0 bg-panel">
        <!-- Tab buttons -->
        <div class="flex border-b border-stroke">
          <button
            v-for="tab in [
              { id: 'entities', label: 'Entities', icon: 'M3 3h18v18H3zM3 9h18M9 21V9' },
              { id: 'history', label: 'History', icon: 'M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'saved', label: 'Saved', icon: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z' },
            ]"
            :key="tab.id"
            @click="sidebarTab = tab.id"
            :class="[
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors border-b-2',
              sidebarTab === tab.id
                ? 'text-accent border-accent'
                : 'text-ink-faint border-transparent hover:text-ink-dim'
            ]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path :d="tab.icon"/></svg>
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-hidden">
          <!-- No connection state -->
          <div v-if="connState.connections.length === 0" class="flex flex-col items-center justify-center h-full p-6 text-center">
            <svg class="mb-3 text-ink-faint opacity-50" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-xs text-ink-faint mb-3">Create a connection to start exploring OData services</p>
            <button
              @click="openModal('add')"
              class="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-base hover:bg-accent-2 transition-colors"
            >
              New Connection
            </button>
          </div>

          <template v-else>
            <EntityBrowser v-show="sidebarTab === 'entities'" />
            <HistoryPanel v-show="sidebarTab === 'history'" />
            <SavedQueries v-show="sidebarTab === 'saved'" />
          </template>
        </div>
      </aside>

      <!-- Main content area -->
      <main class="w-[440px] shrink-0 flex flex-col overflow-hidden">
        <!-- Not connected state -->
        <div v-if="!isConnected && connState.connections.length > 0" class="flex-1 flex items-center justify-center p-8">
          <div class="text-center max-w-sm">
            <svg class="mx-auto mb-4 text-ink-faint opacity-40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="16" cy="16" r="6"/><path d="M16 12v8M12 16h8"/>
              <path d="M7 3 3 7l4 4M3 7h11"/>
            </svg>
            <p class="text-sm text-ink-dim mb-1">Connect to an OData service</p>
            <p class="text-xs text-ink-faint">Enter a service URL and click Connect to parse $metadata and browse entities.</p>
          </div>
        </div>

        <!-- Connected -->
        <template v-else-if="isConnected">
          <!-- Query builder area -->
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="!metaState.parsed || metaState.parsed.entitySets.length === 0" class="flex items-center justify-center h-full text-center">
              <div>
                <p class="text-sm text-ink-dim mb-1">No entity sets found</p>
                <p class="text-xs text-ink-faint">The service metadata did not expose any entity sets.</p>
                <p v-if="metaState.error" class="text-xs text-danger mt-2 font-mono">{{ metaState.error }}</p>
              </div>
            </div>
            <div v-else-if="!queryState.entitySet" class="flex items-center justify-center h-full text-center">
              <div>
                <svg class="mx-auto mb-3 text-ink-faint opacity-50" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
                <p class="text-sm text-ink-dim mb-1">Select an entity set</p>
                <p class="text-xs text-ink-faint">Choose an entity set from the Entities tab to start building your query.</p>
              </div>
            </div>
            <QueryBuilder v-else />
          </div>

          <!-- Action bar + execute -->
          <UrlPreview />
        </template>

        <!-- No connections at all -->
        <div v-else class="flex-1 flex items-center justify-center p-8">
          <div class="text-center max-w-sm">
            <svg class="mx-auto mb-4 text-ink-faint opacity-40" width="48" height="48" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="16" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <p class="text-sm text-ink-dim mb-1">Welcome to OData Explorer</p>
            <p class="text-xs text-ink-faint mb-4">Create a connection to start exploring OData services.</p>
            <div class="flex items-center gap-2 justify-center">
              <button
                @click="openModal('add')"
                class="px-4 py-2 rounded-md text-sm font-medium bg-accent text-base hover:bg-accent-2 transition-colors"
              >
                Create Connection
              </button>
              <button
                @click="createSampleConnection"
                class="px-4 py-2 rounded-md text-sm font-medium border border-stroke text-ink-dim hover:text-ink hover:border-stroke-2 transition-colors"
              >
                Try Sample
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Right results panel -->
      <section v-if="isConnected" class="flex-1 min-w-[400px] border-l border-stroke flex flex-col bg-panel">
        <!-- Results tabs -->
        <div class="flex items-center border-b border-stroke shrink-0">
          <button
            v-for="tab in [
              { id: 'grid', label: 'Grid' },
              { id: 'json', label: 'JSON' },
            ]"
            :key="tab.id"
            @click="resultsTab = tab.id"
            :class="[
              'px-4 py-2 text-xs font-medium transition-colors border-b-2',
              resultsTab === tab.id
                ? 'text-accent border-accent'
                : 'text-ink-faint border-transparent hover:text-ink-dim'
            ]"
          >{{ tab.label }}</button>
        </div>

        <!-- Results content -->
        <div class="flex-1 overflow-hidden">
          <DataGrid v-show="resultsTab === 'grid'" />
          <JsonViewer v-show="resultsTab === 'json'" />
        </div>

        <!-- Response meta footer -->
        <ResponseMeta />
      </section>
    </div>
  </div>
</template>
