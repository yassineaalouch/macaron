# Configuration CORS pour S3

## Problème

Lors de l'upload direct vers S3 depuis le navigateur, vous pouvez rencontrer cette erreur :
```
Access to fetch at 'https://strass-shop.s3.us-east-1.amazonaws.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

Cela signifie que le bucket S3 n'est pas configuré pour autoriser les requêtes depuis votre domaine.

## Solution : Configurer CORS sur S3

### Option 1 : Utiliser le script Node.js (Recommandé)

1. Assurez-vous que votre fichier `.env` contient les variables nécessaires :
   ```
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=strass-shop
   ```

2. Exécutez le script :
   ```bash
   node configure-s3-cors.js
   ```

### Option 2 : Configuration manuelle via AWS Console

1. Allez sur [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Sélectionnez votre bucket `strass-shop`
3. Allez dans l'onglet **Permissions**
4. Faites défiler jusqu'à **Cross-origin resource sharing (CORS)**
5. Cliquez sur **Edit**
6. Collez la configuration suivante :

```json
[
    {
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://strass-shop.com",
            "https://www.strass-shop.com"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedHeaders": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

7. Cliquez sur **Save changes**

### Option 3 : Utiliser AWS CLI

Si vous avez AWS CLI installé :

```bash
aws s3api put-bucket-cors \
  --bucket strass-shop \
  --cors-configuration file://s3-cors-config.json
```

## Vérification

Après avoir configuré CORS, testez l'upload d'images. L'erreur CORS devrait disparaître.

## Configuration pour la PRODUCTION (Solution Automatique - Recommandée)

✅ **NOUVEAU** : Vous pouvez maintenant configurer CORS directement depuis le dashboard admin !

### Option 0 : Configuration automatique depuis le dashboard (LE PLUS SIMPLE)

1. Connectez-vous au dashboard admin sur votre site de production
2. Allez dans **Paramètres** (Settings)
3. Faites défiler jusqu'à la section **"Configuration S3 CORS"**
4. Cliquez sur **"Configurer CORS automatiquement"**

Cette méthode :
- ✅ Utilise automatiquement les variables d'environnement de production
- ✅ Détecte automatiquement le bon bucket (taha-strass-shop en production)
- ✅ Fonctionne directement depuis le serveur de production
- ✅ Pas besoin d'accès aux credentials AWS localement

---

⚠️ **IMPORTANT** : En production, le bucket S3 utilisé est `taha-strass-shop` (et non `strass-shop`).

Pour configurer CORS manuellement sur le bucket de production :

### Option 1 : Utiliser l'API route (Depuis le serveur de production)

Vous pouvez appeler l'API route directement depuis votre navigateur ou via curl :

```bash
# Depuis le navigateur, allez sur :
https://strass-shop.com/api/configure-cors

# Ou via curl :
curl https://strass-shop.com/api/configure-cors
```

Cette méthode utilise automatiquement les variables d'environnement de production configurées sur votre serveur (Vercel, etc.).

### Option 2 : Utiliser le script de production (Local)

```bash
node configure-s3-cors-production.js
```

Ce script configure automatiquement CORS sur le bucket `taha-strass-shop`.

**Note** : Assurez-vous d'utiliser les credentials AWS de **PRODUCTION** dans votre fichier `.env`.

### Option 3 : Configuration manuelle via AWS Console

1. Allez sur [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Sélectionnez le bucket **`taha-strass-shop`** (bucket de production)
3. Allez dans l'onglet **Permissions**
4. Faites défiler jusqu'à **Cross-origin resource sharing (CORS)**
5. Cliquez sur **Edit**
6. Collez la même configuration JSON que ci-dessus
7. Cliquez sur **Save changes**

### Option 4 : Utiliser AWS CLI

```bash
aws s3api put-bucket-cors \
  --bucket taha-strass-shop \
  --cors-configuration file://s3-cors-config.json
```

## Notes importantes

- Les origines autorisées incluent `localhost:3000` pour le développement et `strass-shop.com` pour la production
- **Le bucket de développement est `strass-shop`**
- **Le bucket de production est `taha-strass-shop`** ⚠️
- Si vous ajoutez de nouveaux domaines, mettez à jour la configuration CORS
- Les changements CORS peuvent prendre quelques minutes pour se propager
- Assurez-vous de configurer CORS sur **les deux buckets** si vous utilisez les deux environnements
