<template>
  <div class="monitoring-dashboard">
    <!-- État de chargement -->
    <div v-if="isLoading && !services.length" class="loading-state">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h3 class="loading-title">Initialisation du monitoring</h3>
        <p class="loading-subtitle">Vérification de l'infrastructure en cours...</p>
      </div>
    </div>

    <!-- Dashboard principal -->
    <div v-else class="dashboard-container">

      <!-- Grille principale du dashboard -->
      <div class="dashboard-grid">
        <!-- Performance Metrics -->
        <section class="dashboard-section performance-section">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">Métriques de Performance</h2>
              <p class="section-description">Analyse en temps réel des performances système</p>
            </div>
            <div class="section-actions">
              <button class="section-action-btn" @click="refreshMetrics">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div class="performance-content">
            <!-- CPU Usage Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-title">
                  <div class="chart-icon cpu">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="chart-name">CPU</h3>
                    <p class="chart-value">{{ cpuUsage }}%</p>
                  </div>
                </div>
                <div class="chart-trend" :class="cpuTrend > 0 ? 'positive' : 'negative'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="cpuTrend > 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span>{{ Math.abs(cpuTrend) }}%</span>
                </div>
              </div>
              <div class="chart-area">
                <canvas ref="cpuCanvas" class="chart-canvas"></canvas>
                <div class="chart-overlay">
                  <div class="chart-grid"></div>
                </div>
              </div>
            </div>

            <!-- Memory Usage Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-title">
                  <div class="chart-icon memory">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="chart-name">Mémoire</h3>
                    <p class="chart-value">{{ memoryUsage }}%</p>
                  </div>
                </div>
                <div class="chart-trend" :class="memoryTrend > 0 ? 'positive' : 'negative'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="memoryTrend > 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span>{{ Math.abs(memoryTrend) }}%</span>
                </div>
              </div>
              <div class="chart-area">
                <canvas ref="memoryCanvas" class="chart-canvas"></canvas>
                <div class="chart-overlay">
                  <div class="chart-grid"></div>
                </div>
              </div>
            </div>

            <!-- Network Traffic Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-title">
                  <div class="chart-icon network">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="chart-name">Réseau</h3>
                    <p class="chart-value">{{ networkTraffic }} Mbps</p>
                  </div>
                </div>
                <div class="chart-trend" :class="networkTrend > 0 ? 'positive' : 'negative'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="networkTrend > 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span>{{ Math.abs(networkTrend) }}%</span>
                </div>
              </div>
              <div class="chart-area">
                <canvas ref="networkCanvas" class="chart-canvas"></canvas>
                <div class="chart-overlay">
                  <div class="chart-grid"></div>
                </div>
              </div>
            </div>

            <!-- Response Time Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-title">
                  <div class="chart-icon response">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="chart-name">Latence</h3>
                    <p class="chart-value">{{ responseTime }} ms</p>
                  </div>
                </div>
                <div class="chart-trend" :class="responseTrend < 0 ? 'positive' : 'negative'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="responseTrend < 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span>{{ Math.abs(responseTrend) }}%</span>
                </div>
              </div>
              <div class="chart-area">
                <canvas ref="responseCanvas" class="chart-canvas"></canvas>
                <div class="chart-overlay">
                  <div class="chart-grid"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Services Status -->
        <section class="dashboard-section services-section xl:col-span-2">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">État des Services</h2>
              <p class="section-description">Surveillance en temps réel des composants critiques</p>
            </div>
            <div class="section-actions">
              <button class="section-action-btn" @click="refreshAll">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div class="services-grid">
            <div
              v-for="service in services"
              :key="service.id"
              class="service-card"
              :class="`service-${service.status}`"
            >
              <div class="service-header">
                <div class="service-icon">
                  <div class="icon-container" :class="`icon-${service.status}`">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="service.id === 'asterisk'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      <path v-else-if="service.id.includes('db')" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div class="service-info">
                  <h3 class="service-name">{{ service.name }}</h3>
                  <p class="service-description">{{ service.description }}</p>
                </div>
                <div class="service-status">
                  <span class="status-badge" :class="`status-${service.status}`">
                    {{ service.status }}
                  </span>
                </div>
              </div>

              <div class="service-metrics">
                <div class="metric-item">
                  <span class="metric-label">Temps de réponse</span>
                  <span class="metric-value">{{ service.responseTime || 0 }}ms</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Disponibilité</span>
                  <span class="metric-value">{{ service.uptime || 0 }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Dernière vérification</span>
                  <span class="metric-value">{{ formatServiceLastCheck(service.lastCheck) }}</span>
                </div>
              </div>

              <!-- Bouton de synchronisation pour HelloJADE PostgreSQL -->
              <div v-if="service.id === 'hellojade-db'" class="service-actions">
                <button 
                  @click="triggerManualSync" 
                  :disabled="isSyncing"
                  class="sync-button"
                  :class="{ 'syncing': isSyncing }"
                >
                  <svg v-if="!isSyncing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ isSyncing ? 'Synchronisation...' : 'Synchroniser' }}
                </button>
                
                <!-- Détails de synchronisation -->
                <div v-if="service.syncStatus" class="sync-details">
                  <div class="sync-status" :class="{ 'up-to-date': service.syncStatus.isUpToDate }">
                    <span class="sync-indicator" :class="{ 'synced': service.syncStatus.isUpToDate }"></span>
                    {{ service.syncStatus.message }}
                  </div>
                  <div class="sync-info">
                    <span>Dernière sync: {{ formatSyncTime(service.syncStatus.lastSyncTime) }}</span>
                    <span v-if="service.syncStatus.syncAgeMinutes !== null">
                      (il y a {{ service.syncStatus.syncAgeMinutes }} min)
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="service.errorMessage" class="service-error">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ service.errorMessage }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Logs de synchronisation en direct -->
        <section class="dashboard-section logs-section xl:col-span-2">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">Logs de Synchronisation</h2>
              <p class="section-description">Suivi en temps réel des opérations de synchronisation</p>
            </div>
            <div class="section-actions">
              <button class="section-action-btn" @click="clearLogs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button class="section-action-btn" @click="copyLogs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="logs-container">
            <div class="logs-header">
              <div class="logs-controls">
                <label class="logs-toggle">
                  <input type="checkbox" v-model="autoScroll" />
                  <span>Défilement automatique</span>
                </label>
                <span class="logs-count">{{ syncLogs.length }} entrées</span>
              </div>
            </div>
            
            <div ref="logsContainer" class="logs-content">
              <div 
                v-for="(log, index) in syncLogs" 
                :key="index"
                class="log-entry"
                :class="`log-${log.type}`"
              >
                <div class="log-timestamp">{{ formatLogTime(log.timestamp) }}</div>
                <div class="log-icon">
                  <svg v-if="log.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else-if="log.type === 'error'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="log-message">{{ log.message }}</div>
                <div v-if="log.duration" class="log-duration">{{ log.duration }}ms</div>
              </div>
              
              <div v-if="syncLogs.length === 0" class="logs-empty">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Aucun log de synchronisation disponible</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Détails Base de données Hôpital -->
        <section v-if="hospitalDbService" class="dashboard-section hospital-section">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">Base de données Hôpital</h2>
              <p class="section-description">Détails de la base de données Oracle simulée</p>
            </div>
          </div>

          <div class="hospital-details">
            <div class="hospital-overview">
              <div class="overview-card">
                <div class="overview-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div class="overview-content">
                  <h3 class="overview-title">Statut de la base</h3>
                  <div class="overview-status" :class="`status-${hospitalDbService.status}`">
                    {{ hospitalDbService.status }}
                  </div>
                </div>
              </div>

              <div class="overview-card">
                <div class="overview-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="overview-content">
                  <h3 class="overview-title">Temps de réponse</h3>
                  <div class="overview-value">{{ hospitalDbService.responseTime }}ms</div>
                </div>
              </div>

              <div class="overview-card">
                <div class="overview-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div class="overview-content">
                  <h3 class="overview-title">Enregistrements totaux</h3>
                  <div class="overview-value">{{ hospitalDbService.details?.totalRecords || 0 }}</div>
                </div>
              </div>
            </div>

            <div v-if="hospitalDbService.details?.tableStats" class="table-stats">
              <h3 class="stats-title">Statistiques par table</h3>
              <div class="stats-grid">
                <div 
                  v-for="(count, tableName) in hospitalDbService.details.tableStats" 
                  :key="tableName"
                  class="stat-item"
                >
                  <span class="stat-label">{{ tableName }}</span>
                  <span class="stat-value">{{ count }}</span>
                </div>
              </div>
            </div>

            <div v-if="hospitalDbService.details?.occupiedRooms !== undefined || hospitalDbService.details?.activeHospitalizations !== undefined" class="hospital-metrics">
              <div class="metric-row">
                <div class="metric-card-small">
                  <div class="metric-icon-small">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div class="metric-content-small">
                    <span class="metric-label-small">Chambres occupées</span>
                    <span class="metric-value-small">{{ hospitalDbService.details.occupiedRooms || 0 }}</span>
                  </div>
                </div>

                <div class="metric-card-small">
                  <div class="metric-icon-small">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="metric-content-small">
                    <span class="metric-label-small">Hospitalisations actives</span>
                    <span class="metric-value-small">{{ hospitalDbService.details.activeHospitalizations || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, nextTick } from 'vue'
import { useMonitoringStore } from '@/stores'

const monitoringStore = useMonitoringStore()

// Getters du store
const {
  services,
  isLoading
} = monitoringStore

// Références aux canvas
const cpuCanvas = ref<HTMLCanvasElement>()
const memoryCanvas = ref<HTMLCanvasElement>()
const networkCanvas = ref<HTMLCanvasElement>()
const responseCanvas = ref<HTMLCanvasElement>()

// Données de performance simulées
const cpuUsage = ref(45)
const memoryUsage = ref(72)
const networkTraffic = ref(156)
const responseTime = ref(48)

const cpuTrend = ref(2.5)
const memoryTrend = ref(-1.2)
const networkTrend = ref(8.7)
const responseTrend = ref(-3.1)

// Historique des données pour les graphiques (plus de points pour des lignes fluides)
const cpuHistory = ref<number[]>([])
const memoryHistory = ref<number[]>([])
const networkHistory = ref<number[]>([])
const responseHistory = ref<number[]>([])

// Configuration des graphiques
const chartConfig = {
  maxPoints: 60, // 60 points pour 5 minutes d'historique
  updateInterval: 5000, // 5 secondes
  lineWidth: 2,
  gridLines: 5
}

// Couleurs des graphiques
const chartColors = {
  cpu: { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.1)', grid: 'rgba(239, 68, 68, 0.1)' },
  memory: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', grid: 'rgba(16, 185, 129, 0.1)' },
  network: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)', grid: 'rgba(139, 92, 246, 0.1)' },
  response: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)', grid: 'rgba(245, 158, 11, 0.1)' }
}



// Variables pour la synchronisation et les logs
const isSyncing = ref(false)
const syncLogs = ref<Array<{
  timestamp: Date
  type: 'info' | 'success' | 'error'
  message: string
  duration?: number
}>>([])
const autoScroll = ref(true)
const logsContainer = ref<HTMLDivElement>()

const hospitalDbService = computed(() => {
  return services.value?.find(service => service.id === 'hospital-db') || null
})

// Fonction utilitaire pour formater la dernière vérification d'un service
const formatServiceLastCheck = (date: Date | undefined) => {
  if (!date) return 'Jamais'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Fonction pour formater le temps de synchronisation
const formatSyncTime = (time: string | undefined) => {
  if (!time || time === 'Jamais' || time === 'Erreur') return time
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(time))
}

// Fonction pour formater le temps des logs
const formatLogTime = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// Fonction pour ajouter un log
const addLog = (type: 'info' | 'success' | 'error', message: string, duration?: number) => {
  syncLogs.value.unshift({
    timestamp: new Date(),
    type,
    message,
    duration
  })
  
  // Limiter à 100 logs
  if (syncLogs.value.length > 100) {
    syncLogs.value = syncLogs.value.slice(0, 100)
  }
  
  // Auto-scroll
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = 0
      }
    })
  }
}

// Fonction pour déclencher la synchronisation manuelle
const triggerManualSync = async () => {
  if (isSyncing.value) return
  
  isSyncing.value = true
  addLog('info', '🔄 Démarrage de la synchronisation manuelle...')
  
  try {
    const startTime = Date.now()
    
    const response = await fetch('/api/monitoring/hellojade-db/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    const duration = Date.now() - startTime
    
    if (result.success) {
      addLog('success', `✅ ${result.message}`, duration)
      
      // Ajouter les détails par table
      if (result.results) {
        Object.entries(result.results).forEach(([table, tableResult]: [string, any]) => {
          if (tableResult.success) {
            addLog('success', `📊 ${table}: ${tableResult.message}`)
          } else {
            addLog('error', `❌ ${table}: ${tableResult.message}`)
          }
        })
      }
      
      // Rafraîchir le statut du service
      await monitoringStore.checkServiceStatus('hellojade-db')
      
    } else {
      addLog('error', `❌ Erreur: ${result.error || 'Synchronisation échouée'}`, duration)
    }
    
  } catch (error: any) {
    addLog('error', `❌ Erreur réseau: ${error.message}`)
  } finally {
    isSyncing.value = false
  }
}

// Fonction pour effacer les logs
const clearLogs = () => {
  syncLogs.value = []
}

// Fonction pour copier les logs
const copyLogs = async () => {
  const logsText = syncLogs.value
    .map(log => `[${formatLogTime(log.timestamp)}] ${log.type.toUpperCase()}: ${log.message}${log.duration ? ` (${log.duration}ms)` : ''}`)
    .join('\n')
  
  try {
    await navigator.clipboard.writeText(logsText)
    addLog('success', '📋 Logs copiés dans le presse-papiers')
  } catch (error) {
    addLog('error', '❌ Impossible de copier les logs')
  }
}

// Fonction pour dessiner un graphique en ligne
const drawLineChart = (
  canvas: HTMLCanvasElement,
  data: number[],
  colors: { line: string; fill: string; grid: string },
  maxValue: number = 100
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Effacer le canvas
  ctx.clearRect(0, 0, width, height)

  // Dessiner la grille
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  for (let i = 0; i <= chartConfig.gridLines; i++) {
    const y = (height / chartConfig.gridLines) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  if (data.length < 2) return

  // Dessiner la ligne
  ctx.strokeStyle = colors.line
  ctx.lineWidth = chartConfig.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Créer le chemin de la ligne
  ctx.beginPath()
  data.forEach((value, index) => {
    const x = (width / (data.length - 1)) * index
    const y = height - (value / maxValue) * height
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // Remplir l'aire sous la courbe
  ctx.fillStyle = colors.fill
  ctx.beginPath()
  ctx.moveTo(0, height)
  data.forEach((value, index) => {
    const x = (width / (data.length - 1)) * index
    const y = height - (value / maxValue) * height
    ctx.lineTo(x, y)
  })
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
}

// Fonction pour initialiser un graphique
const initChart = (canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
}

// Fonction pour mettre à jour les métriques de performance
const updatePerformanceMetrics = () => {
  // Simuler des variations réalistes
  cpuUsage.value = Math.max(20, Math.min(90, cpuUsage.value + (Math.random() - 0.5) * 10))
  memoryUsage.value = Math.max(50, Math.min(85, memoryUsage.value + (Math.random() - 0.5) * 5))
  networkTraffic.value = Math.max(80, Math.min(200, networkTraffic.value + (Math.random() - 0.5) * 20))
  responseTime.value = Math.max(30, Math.min(80, responseTime.value + (Math.random() - 0.5) * 8))

  // Mettre à jour les tendances
  cpuTrend.value = (Math.random() - 0.5) * 10
  memoryTrend.value = (Math.random() - 0.5) * 6
  networkTrend.value = (Math.random() - 0.5) * 15
  responseTrend.value = (Math.random() - 0.5) * 8

  // Mettre à jour l'historique
  cpuHistory.value.push(Math.round(cpuUsage.value))
  memoryHistory.value.push(Math.round(memoryUsage.value))
  networkHistory.value.push(Math.round(networkTraffic.value))
  responseHistory.value.push(Math.round(responseTime.value))

  // Limiter le nombre de points
  if (cpuHistory.value.length > chartConfig.maxPoints) {
    cpuHistory.value.shift()
    memoryHistory.value.shift()
    networkHistory.value.shift()
    responseHistory.value.shift()
  }

  // Redessiner les graphiques
  nextTick(() => {
    if (cpuCanvas.value) {
      drawLineChart(cpuCanvas.value, cpuHistory.value, chartColors.cpu, 100)
    }
    if (memoryCanvas.value) {
      drawLineChart(memoryCanvas.value, memoryHistory.value, chartColors.memory, 100)
    }
    if (networkCanvas.value) {
      const maxNetwork = Math.max(...networkHistory.value, 200)
      drawLineChart(networkCanvas.value, networkHistory.value, chartColors.network, maxNetwork)
    }
    if (responseCanvas.value) {
      const maxResponse = Math.max(...responseHistory.value, 100)
      drawLineChart(responseCanvas.value, responseHistory.value, chartColors.response, maxResponse)
    }
  })
}

// Actions
const refreshAll = async () => {
  try {
    await monitoringStore.checkAllServices()
    await monitoringStore.updateSystemMetrics()
  } catch (error) {
    console.error('❌ Erreur lors de l\'actualisation:', error)
  }
}

const refreshMetrics = () => {
  updatePerformanceMetrics()
}

// Lifecycle
onMounted(async () => {
  try {
    console.log('🔄 Initialisation de la vue monitoring...')
    await monitoringStore.initialize()
    monitoringStore.startAutoRefresh()
    
    // Initialiser les données historiques
    for (let i = 0; i < chartConfig.maxPoints; i++) {
      cpuHistory.value.push(Math.floor(Math.random() * 30 + 40))
      memoryHistory.value.push(Math.floor(Math.random() * 20 + 60))
      networkHistory.value.push(Math.floor(Math.random() * 100 + 100))
      responseHistory.value.push(Math.floor(Math.random() * 20 + 40))
    }
    
    // Initialiser les graphiques après le rendu
    await nextTick()
    
    if (cpuCanvas.value) initChart(cpuCanvas.value)
    if (memoryCanvas.value) initChart(memoryCanvas.value)
    if (networkCanvas.value) initChart(networkCanvas.value)
    if (responseCanvas.value) initChart(responseCanvas.value)
    
    // Dessiner les graphiques initiaux
    updatePerformanceMetrics()
    
    // Démarrer la mise à jour automatique
    setInterval(updatePerformanceMetrics, chartConfig.updateInterval)
    
    // Gérer le redimensionnement
    const resizeObserver = new ResizeObserver(() => {
      if (cpuCanvas.value) initChart(cpuCanvas.value)
      if (memoryCanvas.value) initChart(memoryCanvas.value)
      if (networkCanvas.value) initChart(networkCanvas.value)
      if (responseCanvas.value) initChart(responseCanvas.value)
      
      updatePerformanceMetrics()
    })
    
    const chartArea = document.querySelector('.performance-content')
    if (chartArea) {
      resizeObserver.observe(chartArea)
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du monitoring:', error)
  }
})
</script>

<style scoped>
.monitoring-dashboard {
  @apply min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900;
}

/* Loading State */
.loading-state {
  @apply flex items-center justify-center min-h-screen;
}

.loading-container {
  @apply text-center;
}

.loading-spinner {
  @apply relative w-16 h-16 mx-auto mb-6;
}

.spinner-ring {
  @apply absolute w-full h-full border-4 border-transparent border-t-blue-600 rounded-full animate-spin;
}

.spinner-ring:nth-child(1) {
  animation-duration: 1s;
}

.spinner-ring:nth-child(2) {
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  animation-duration: 2s;
}

.loading-title {
  @apply text-xl font-semibold text-slate-800 dark:text-white mb-2;
}

.loading-subtitle {
  @apply text-slate-600 dark:text-slate-400;
}

/* Dashboard Container */
.dashboard-container {
  @apply p-6 space-y-6 max-w-7xl mx-auto;
}

/* Dashboard Grid */
.dashboard-grid {
  @apply grid grid-cols-1 xl:grid-cols-2 gap-8;
}

/* Dashboard Sections */
.dashboard-section {
  @apply bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden;
}

.section-header {
  @apply flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700;
}

.section-title-group {
  @apply flex-1;
}

.section-title {
  @apply text-xl font-semibold text-slate-900 dark:text-white mb-1;
}

.section-description {
  @apply text-slate-600 dark:text-slate-400 text-sm;
}

.section-actions {
  @apply flex items-center space-x-2;
}

.section-action-btn {
  @apply p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200;
}

/* Services Grid */
.services-grid {
  @apply p-6 grid grid-cols-1 md:grid-cols-2 gap-6;
}

.service-card {
  @apply bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:shadow-md;
}

.service-card.service-online {
  @apply border-green-200 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10;
}

.service-card.service-warning {
  @apply border-yellow-200 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10;
}

.service-card.service-offline {
  @apply border-red-200 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10;
}

.service-header {
  @apply flex items-center justify-between mb-4;
}

.service-icon {
  @apply flex items-center space-x-3;
}

.icon-container {
  @apply w-10 h-10 rounded-lg flex items-center justify-center;
}

.icon-online {
  @apply bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300;
}

.icon-warning {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300;
}

.icon-offline {
  @apply bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300;
}

.service-info {
  @apply flex-1 ml-3;
}

.service-name {
  @apply font-semibold text-slate-900 dark:text-white;
}

.service-description {
  @apply text-sm text-slate-600 dark:text-slate-400;
}

.service-status {
  @apply flex items-center;
}

.status-badge {
  @apply px-3 py-1 text-xs font-medium rounded-full;
}

.status-online {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300;
}

.status-warning {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300;
}

.status-offline {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300;
}

.service-metrics {
  @apply grid grid-cols-3 gap-4 mb-4;
}

.metric-item {
  @apply flex flex-col;
}

.metric-label {
  @apply text-xs text-slate-500 dark:text-slate-400 mb-1;
}

.metric-value {
  @apply text-sm font-medium text-slate-900 dark:text-white;
}

.service-error {
  @apply flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm;
}

/* Performance Section */
.performance-section {
  @apply xl:col-span-2;
}

.performance-content {
  @apply p-6 grid grid-cols-2 gap-4;
}

.chart-container {
  @apply bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 transition-all duration-300 hover:shadow-lg hover:scale-[1.02];
}

.chart-header {
  @apply flex items-center justify-between mb-3;
}

.chart-title {
  @apply flex items-center space-x-2;
}

.chart-icon {
  @apply w-8 h-8 rounded-lg flex items-center justify-center;
}

.chart-icon.cpu {
  @apply bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300;
}

.chart-icon.memory {
  @apply bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300;
}

.chart-icon.network {
  @apply bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300;
}

.chart-icon.response {
  @apply bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300;
}

.chart-name {
  @apply text-sm font-semibold text-slate-900 dark:text-white;
}

.chart-value {
  @apply text-xl font-bold text-slate-900 dark:text-white;
}

.chart-trend {
  @apply flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-lg;
}

.chart-trend.positive {
  @apply text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20;
}

.chart-trend.negative {
  @apply text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20;
}

.chart-area {
  @apply h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden relative;
}

.chart-canvas {
  @apply w-full h-full;
}

.chart-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.chart-grid {
  @apply w-full h-full;
}

/* Responsive pour les graphiques */
@media (max-width: 1024px) {
  .performance-content {
    @apply grid-cols-1 gap-4;
  }
  
  .chart-container {
    @apply hover:scale-[1.01];
  }
}

@media (max-width: 768px) {
  .performance-content {
    @apply grid-cols-1;
  }
  
  .chart-area {
    @apply h-20;
  }
  
  .chart-value {
    @apply text-lg;
  }
  
  .chart-name {
    @apply text-xs;
  }
}

/* Hospital Section */
.hospital-section {
  @apply xl:col-span-2;
}

.hospital-details {
  @apply p-6 space-y-6;
}

.hospital-overview {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.overview-card {
  @apply bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center space-x-3;
}

.overview-icon {
  @apply w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300;
}

.overview-content {
  @apply flex-1;
}

.overview-title {
  @apply text-sm font-medium text-slate-600 dark:text-slate-400 mb-1;
}

.overview-status {
  @apply text-lg font-semibold;
}

.overview-status.status-online {
  @apply text-green-600 dark:text-green-400;
}

.overview-status.status-warning {
  @apply text-yellow-600 dark:text-yellow-400;
}

.overview-status.status-offline {
  @apply text-red-600 dark:text-red-400;
}

.overview-value {
  @apply text-lg font-semibold text-slate-900 dark:text-white;
}

/* Service Actions */
.service-actions {
  @apply mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg;
}

.sync-button {
  @apply flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200;
}

.sync-button.syncing {
  @apply bg-blue-500 cursor-not-allowed;
}

.sync-details {
  @apply mt-3 space-y-2;
}

.sync-status {
  @apply flex items-center space-x-2 text-sm;
}

.sync-status.up-to-date {
  @apply text-green-600 dark:text-green-400;
}

.sync-indicator {
  @apply w-2 h-2 rounded-full;
}

.sync-indicator.synced {
  @apply bg-green-500;
}

.sync-info {
  @apply text-xs text-slate-500 dark:text-slate-400;
}

/* Logs Section */
.logs-section {
  @apply xl:col-span-2;
}

.logs-container {
  @apply p-6;
}

.logs-header {
  @apply flex items-center justify-between mb-4;
}

.logs-controls {
  @apply flex items-center space-x-4;
}

.logs-toggle {
  @apply flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400;
}

.logs-toggle input[type="checkbox"] {
  @apply w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600;
}

.logs-count {
  @apply text-sm text-slate-500 dark:text-slate-400;
}

.logs-content {
  @apply bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto;
}

.log-entry {
  @apply flex items-center space-x-3 p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0;
}

.log-entry.log-success {
  @apply bg-green-50 dark:bg-green-900/20;
}

.log-entry.log-error {
  @apply bg-red-50 dark:bg-red-900/20;
}

.log-entry.log-info {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.log-timestamp {
  @apply text-xs text-slate-500 dark:text-slate-400 font-mono min-w-[60px];
}

.log-icon {
  @apply flex-shrink-0;
}

.log-entry.log-success .log-icon {
  @apply text-green-600 dark:text-green-400;
}

.log-entry.log-error .log-icon {
  @apply text-red-600 dark:text-red-400;
}

.log-entry.log-info .log-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.log-message {
  @apply flex-1 text-sm text-slate-700 dark:text-slate-300;
}

.log-duration {
  @apply text-xs text-slate-500 dark:text-slate-400 font-mono;
}

.logs-empty {
  @apply flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400;
}

.logs-empty svg {
  @apply mb-2;
}

.logs-empty p {
  @apply text-sm;
}

.overview-status {
  @apply text-lg font-semibold;
}

.overview-status.status-online {
  @apply text-green-600 dark:text-green-400;
}

.overview-status.status-warning {
  @apply text-yellow-600 dark:text-yellow-400;
}

.overview-status.status-offline {
  @apply text-red-600 dark:text-red-400;
}

.overview-value {
  @apply text-lg font-semibold text-slate-900 dark:text-white;
}

.table-stats {
  @apply bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6;
}

.stats-title {
  @apply text-lg font-semibold text-slate-900 dark:text-white mb-4;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4;
}

.stat-item {
  @apply flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600;
}

.stat-label {
  @apply text-xs text-slate-600 dark:text-slate-400 mb-1 text-center;
}

.stat-value {
  @apply text-lg font-semibold text-slate-900 dark:text-white;
}

.hospital-metrics {
  @apply bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6;
}

.metric-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.metric-card-small {
  @apply bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center space-x-3 border border-slate-200 dark:border-slate-600;
}

.metric-icon-small {
  @apply w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-300;
}

.metric-content-small {
  @apply flex-1;
}

.metric-label-small {
  @apply block text-sm text-slate-600 dark:text-slate-400;
}

.metric-value-small {
  @apply block text-xl font-semibold text-slate-900 dark:text-white;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-grid {
    @apply grid-cols-1;
  }
  
  .hospital-section {
    @apply col-span-1;
  }
}

@media (max-width: 768px) {
  .header-content {
    @apply space-y-4;
  }
  
  .global-status {
    @apply flex-col space-y-2;
  }
  
  .metrics-grid {
    @apply grid-cols-2;
  }
  
  .service-metrics {
    @apply grid-cols-1;
  }
  
  .hospital-overview {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-1;
  }
}
</style> 
