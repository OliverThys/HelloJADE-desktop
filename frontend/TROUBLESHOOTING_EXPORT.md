# Guide de Dépannage - Export PDF

## Problème : Le bouton d'export PDF ne fonctionne pas

### Étapes de diagnostic

1. **Ouvrir la console du navigateur**
   - Appuyez sur F12 ou Clic droit → Inspecter
   - Allez dans l'onglet "Console"

2. **Tester l'export PDF**
   - Allez sur http://localhost:5173/patients
   - Cliquez sur "Exporter"
   - Sélectionnez des patients
   - Choisissez "PDF" comme format
   - Cliquez sur "Confirmer"

3. **Vérifier les messages dans la console**
   - Vous devriez voir des messages comme :
     - "Début de la génération PDF pour X patients"
     - "Tentative de téléchargement du fichier: patients_hellojade_YYYY-MM-DD.pdf"
     - "Tentative avec doc.save()" ou "Tentative avec Blob"

### Solutions possibles

#### 1. Problème de permissions du navigateur
**Symptômes :** Aucun message d'erreur, mais le fichier ne se télécharge pas

**Solutions :**
- Vérifiez que les téléchargements sont autorisés dans votre navigateur
- Essayez de télécharger un fichier simple depuis un autre site
- Vérifiez les paramètres de sécurité de votre navigateur

#### 2. Problème avec jsPDF ou jspdf-autotable
**Symptômes :** Erreur "jsPDF is not defined" ou "doc.autoTable is not a function"

**Solutions :**
- Ouvrez le fichier de test : `frontend/test-pdf-export.html` dans votre navigateur
- Cliquez sur "Tester Export PDF"
- Si cela fonctionne, le problème vient de l'application Vue
- Testez aussi : `frontend/test-import.html` pour vérifier les imports

#### 3. Problème avec les données des patients
**Symptômes :** Erreur "Cannot read property 'nom' of undefined"

**Solutions :**
- Vérifiez que les patients ont bien les propriétés requises
- Regardez dans la console les messages de validation

#### 4. Problème de build
**Symptômes :** Erreurs de compilation ou modules non trouvés

**Solutions :**
```bash
# Dans le dossier frontend
npm install
npm run dev
```

### Test manuel

1. **Ouvrir la console du navigateur**
2. **Copier et coller ce code :**
```javascript
// Test simple d'export PDF avec autoTable
Promise.all([
  import('jspdf'),
  import('jspdf-autotable')
]).then(([{ default: jsPDF }, autoTableModule]) => {
  const autoTable = autoTableModule.default;
  const doc = new jsPDF();
  doc.text('Test HelloJADE', 20, 20);
  
  autoTable(doc, {
    startY: 40,
    head: [['Nom', 'Prénom']],
    body: [['Dupont', 'Jean'], ['Martin', 'Marie']],
    theme: 'grid'
  });
  
  doc.save('test.pdf');
  console.log('Test réussi !');
}).catch(error => {
  console.error('Erreur:', error);
});
```

### Logs de débogage

Les logs suivants devraient apparaître dans la console :

```
Début de l'export PDF pour X patients
Début de la génération PDF pour X patients
Tentative de téléchargement du fichier: patients_hellojade_YYYY-MM-DD.pdf
Tentative avec doc.save()
PDF généré avec succès (méthode doc.save)
Export PDF réussi pour X patients
```

### Contact

Si le problème persiste, vérifiez :
1. La version de votre navigateur
2. Les paramètres de sécurité
3. Les extensions qui pourraient bloquer les téléchargements 