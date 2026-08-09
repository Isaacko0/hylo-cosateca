# HYLO_COSATECA_MAPPING.md
## Mapeo técnico: HSCSG v15 OS → Hylo (fork hylo-cosateca)

**Fecha:** 2026-08-09
**Base:** Hylo `dev` (Apache 2.0) @ `Isaacko0/hylo-cosateca`
**Dominio origen:** HSCSG v15 OS (`Isaacko0/HSCSG_v15_OS`, MIT)

---

## 1. Principio de arquitectura (doble capa)

```
┌──────────────────────────────────────────────────────────────┐
│  HYLO (hylo-cosateca) — capa SOCIAL/COMUNITARIA            │
│  Auth · Groups · Offers/Needs · Projects · Events · API    │
│  Real-time · Mobile · Desktop · OAuth 2.0                  │
└──────────────────────────────────────────────────────────────┘
                        ▲ publica / lee
                        │
┌──────────────────────────────────────────────────────────────┐
│  HSCSG v15 OS — capa NODO LOCAL (offline/privado)        │
│  CaaS · ZNU · Lucidez · Store · i18n · Células (local)   │
└──────────────────────────────────────────────────────────────┘
```

**Regla:** lo social/comunitario → Hylo. Lo privado/offline/nodo → HSCSG local.
HSCSG se convierte en *cliente ligero* de Hylo para lo social.

---

## 2. Mapeo de dominio (módulos HSCSG → tipos Hylo)

| HSCSG v15 OS (módulo) | Tipo Hylo nativo | PostType / objeto | Notas |
|---|---|---|---|
| **Solarpunk: Ofertas** | `Offer` | `POST_TYPE.Offer` | 1:1, ya existe en Hylo |
| **Solarpunk: Necesidades** | `Need` | `POST_TYPE.Request` | 1:1 (Request = need) |
| **Solarpunk: Web of Trust** | `GroupMembership` + custom field | `Membership` | Requiere custom field `trustLevel` |
| **Solarpunk: Santuario** | `Post` | `POST_TYPE.Discussion` + tag `sanctuary` | Nuevo post type o tag |
| **Mundus: Manifiesto** | `Post` (pinned) | `POST_TYPE.Discussion` | En grupo `cosateca-root` |
| **Mundus: 13 Pilares** | `Project` + `Task` ×13 | `Project` | O custom type `Pilar` |
| **Células: Manual** | `Group` (Célula) | `COMMUNITY_TYPE` | Nested subgroups (holónica) |
| **Soberanía: 13 Pilares** | `Proposal` + `Agreement` | `Proposal` | Gobernanza nativa |
| **Integral: Loop CDS→FRS** | `Track` + `Action` | `Track` | Learning Journeys nativas |
| **Life: Metas (I×U)** | `Project` + custom field | `Project` | O post type `Meta` |
| **Civilizaciones: Horizontes** | `Resource` / `Link` post | `POST_TYPE.Resource` | Directorio público |
| **CaaS / ZNU / Lucidez** | — (NO en Hylo) | — | Quedan en HSCSG local |

### Tipos nativos confirmados en Hylo (`packages/shared/src/constants.js`)
- `POST_TYPE`: Discussion, Offer, Request, Event, Project, Proposal, Agreement, Resource, Track
- `COMMUNITY_TYPE`: Group, Network
- `AnalyticsEvents`: POST_CREATED, TRACK_COMPLETED, GROUP_CREATED, etc.

---

## 3. Custom Post Types necesarios (nuevos en hylo-cosateca)

### 3.1 `POST_TYPE.Sanctuary`
- **Propósito:** Espacios de silencio/respiro (Solarpunk Santuario)
- **Campos:** `durationMin`, `facilitator`, `intention`
- **Implementación:** `packages/shared/src/constants.js` + `apps/backend/api/models/Post.js` + web UI

### 3.2 `POST_TYPE.Pilar` (o usar `Project` con tag)
- **Propósito:** Los 13 pilares de Mundus / Soberanía
- **Campos:** `pilarIndex` (1-13), `domain` (mundus|soberania), `status`
- **Alternativa:** `Project` + custom field `pilarIndex` (menos invasivo)

### 3.3 `POST_TYPE.Meta` (o usar `Project` con tag)
- **Propósito:** Metas de vida (Life, fórmula I×U)
- **Campos:** `intention` (I), `urgency` (U), `progress`
- **Alternativa:** `Project` + custom field `intention`/`urgency`

### 3.4 Custom field en `GroupMembership`: `trustLevel`
- **Propósito:** Web of Trust (Solarpunk)
- **Valores:** `null|low|medium|high|core`

---

## 4. Flujo "Publicar en Hylo" desde HSCSG (Fase 2)

### 4.1 OAuth 2.0 (Client Credentials para server-to-server)
```
POST /oauth/token
grant_type=client_credentials
client_id=<hylo-cosateca-client>
client_secret=<secret>
scope=posts:write groups:write
```

### 4.2 Mutations GraphQL (Hylo backend)
```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    description
    postType
    groupId
  }
}
```

### 4.3 Módulo HSCSG `/comunidad`
- Botón "Publicar Manifiesto Mundus" → `createPost` en grupo `cosateca-root`
- Botón "Publicar Oferta Solarpunk" → `createPost` con `postType: Offer`
- Botón "Publicar Meta Life" → `createPost` con `postType: Project` + custom fields

---

## 5. Migración de datos (Fase 3)
- **Origen:** `localStorage` de HSCSG v15 OS (`CIVILIZATION_LINKS`, `celulas`, `mundus`, etc.)
- **Destino:** Hylo API (groups, posts, memberships)
- **Script:** `scripts/migrate-hscsg-to-hylo.mjs` (idempotente, dry-run primero)
- **Backup:** `HSCSG_v15_OS_BACKUP_20260808_133202/` ya existe

---

## 6. Próximos pasos inmediatos
1. ✅ Fork + build de `@hylo/shared` (hecho)
2. ⏳ `yarn backend:dev` + `yarn web:dev` corriendo (verificar puertos)
3. ⏳ Contactar `hello@hylo.com` para OAuth client_id/secret
4. ⏳ Implementar `POST_TYPE.Sanctuary` + `trustLevel` field (Fase 1)
5. ⏳ Módulo HSCSG `/comunidad` con OAuth (Fase 2)

---

## 7. Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| API de Hylo cambia (MVP) | Fork propio, pinnear versión, tests de contrato |
| Curva de aprendizaje (18k commits) | 2 semanas onboarding en Fase 0 |
| Migración pierde datos | Scripts idempotentes + dry-run + backup |

---

**Licencia:** Apache 2.0 (Hylo) + MIT (HSCSG) — compatibles.
**Autor:** Isaac Ko · Cosateca OS
