const axios = require('axios')

async function testFrontend() {
  console.log('🔍 Test du frontend')
  console.log('==================')
  
  try {
    console.log('📡 Test de l\'accès au frontend...')
    const response = await axios.get('http://localhost:5173')
    
    console.log('✅ Frontend accessible:')
    console.log('  Status:', response.status)
    console.log('  Content-Type:', response.headers['content-type'])
    
    if (response.data.includes('HelloJADE')) {
      console.log('✅ Page HelloJADE détectée')
    }
    
    console.log('\n🎉 Frontend fonctionne !')
    console.log('📱 Accédez à: http://localhost:5173/monitoring')
    
  } catch (error) {
    console.log('❌ Erreur d\'accès au frontend:')
    if (error.response) {
      console.log('  Status:', error.response.status)
    } else {
      console.log('  Erreur:', error.message)
    }
    console.log('\n💡 Vérifiez que le frontend est démarré avec: npm run dev')
  }
}

testFrontend() 