# Configurazione persistente per pgAdmin

## Cosa abbiamo configurato

### 1. Volume persistente
- `pgadmin_data`: volume Docker che salva tutte le configurazioni di pgAdmin
- Quando fai `docker compose down` e `up`, le configurazioni vengono mantenute

### 2. Server pre-configurato
- Il file `pgadmin/servers.json` pre-configura la connessione al database PostgreSQL
- La connessione appare automaticamente nella lista server di pgAdmin
- Nome server: "MPP PostgreSQL"

### 3. Configurazioni semplificate
- `PGADMIN_CONFIG_SERVER_MODE: 'False'` - disabilita il server mode
- `PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'` - non richiede master password

## Come accedere

1. Apri il browser su: http://localhost:5050
2. Login:
   - Email: admin@example.com
   - Password: admin
3. Il server "MPP PostgreSQL" dovrebbe essere già presente nella lista
4. Clicca su "MPP PostgreSQL" e inserisci la password del database: `mpp_pw`

## Persistenza garantita

Ora puoi fare:
```bash
docker compose down
docker compose up -d
```

E la connessione al database rimarrà configurata in pgAdmin!

## Note

- I dati del database PostgreSQL sono già persistenti tramite il volume `db_data`
- Le configurazioni di pgAdmin sono ora persistenti tramite il volume `pgadmin_data`
- La connessione al server è pre-configurata ma dovrai inserire la password del database la prima volta 
