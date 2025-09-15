FROM node:20-alpine

# Installa dipendenze per build tools nativi
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia i file di package per installare dipendenze
COPY package.json package-lock.json* ./

# Installa dipendenze con npm install invece di npm ci per più flessibilità
RUN npm install --no-audit --no-fund

# Copia il resto del codice
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]