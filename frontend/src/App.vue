<template>
  <div id="app">
    <header class="bg-blue-600 text-white p-4">
      <h1 class="text-2xl font-bold">HelloJADE v1.0</h1>
      <p class="text-sm">Application de gestion post-hospitalisation</p>
    </header>
    
    <main class="container mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Carte Monitoring -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">📊 Monitoring</h2>
          <p class="text-gray-600 mb-4">Accédez aux dashboards Grafana pour surveiller votre application.</p>
          <a href="http://localhost:3000" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Ouvrir Grafana
          </a>
        </div>

        <!-- Carte IA -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">🤖 Intelligence Artificielle</h2>
          <p class="text-gray-600 mb-4">Gérez vos modèles LLM avec Ollama.</p>
          <a href="http://localhost:11434" target="_blank" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Ouvrir Ollama
          </a>
        </div>

        <!-- Carte Métriques -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">📈 Métriques</h2>
          <p class="text-gray-600 mb-4">Consultez les métriques Prometheus de votre application.</p>
          <a href="http://localhost:9090" target="_blank" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
            Ouvrir Prometheus
          </a>
        </div>

        <!-- Carte Patients -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">👥 Gestion Patients</h2>
          <p class="text-gray-600 mb-4">Gérez vos dossiers patients et suivi post-hospitalisation.</p>
          <button class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            Gérer les Patients
          </button>
        </div>

        <!-- Carte Appels -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">📞 Téléphonie</h2>
          <p class="text-gray-600 mb-4">Système d'appels automatiques intégré Zadarma.</p>
          <button class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Gérer les Appels
          </button>
        </div>

        <!-- Carte Configuration -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">⚙️ Configuration</h2>
          <p class="text-gray-600 mb-4">Paramétrez votre application et vos préférences.</p>
          <button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Configuration
          </button>
        </div>
      </div>

      <!-- Section Statut -->
      <div class="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">🔍 Statut des Services</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p class="text-sm font-medium">Redis</p>
            <p class="text-xs text-gray-500">localhost:6379</p>
          </div>
          <div class="text-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p class="text-sm font-medium">Grafana</p>
            <p class="text-xs text-gray-500">localhost:3000</p>
          </div>
          <div class="text-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p class="text-sm font-medium">Prometheus</p>
            <p class="text-xs text-gray-500">localhost:9090</p>
          </div>
          <div class="text-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p class="text-sm font-medium">Ollama</p>
            <p class="text-xs text-gray-500">localhost:11434</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="bg-gray-800 text-white p-4 mt-8">
      <div class="container mx-auto text-center">
        <p>&copy; 2024 HelloJADE v1.0 - Application de gestion post-hospitalisation</p>
        <p class="text-sm text-gray-400">Développé avec Vue.js 3, Tauri et IA locale</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Configuration de l'application
console.log('HelloJADE v1.0 - Application démarrée')
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background-color: #f3f4f6;
}

.container {
  max-width: 1200px;
}

/* Styles Tailwind CSS seront injectés automatiquement */
</style> 