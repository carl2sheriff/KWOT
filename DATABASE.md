# KWOT CRM - Database Documentation

**Provider:** Neon PostgreSQL (eu-central-1)  
**ORM:** Prisma 6.19.2

---

## 📊 Schema Overview

### Core Entities

**5 tables principales:**
1. **users** - Utilisateurs système (auth + roles)
2. **clients** - Clients CRM
3. **contacts** - Contacts clients
4. **projects** - Projets clients
5. **tasks** - Tâches projets
6. **notes** - Activity log (optionnel)

---

## 🗂️ Tables

### users
```sql
- id (UUID, PK)
- email (unique)
- name
- role (admin, manager, user)
- avatar
- created_at
- updated_at
```

**Relations:**
- clients[] (created_by)
- projects[] (owner)
- tasks[] (assignee)

---

### clients
```sql
- id (UUID, PK)
- name
- email
- phone
- company
- address
- notes
- status (active, inactive, prospect)
- created_by_id (FK → users)
- created_at
- updated_at
```

**Relations:**
- createdBy (User)
- projects[]
- contacts[]

---

### contacts
```sql
- id (UUID, PK)
- client_id (FK → clients, CASCADE)
- name
- email
- phone
- role
- notes
- created_at
- updated_at
```

---

### projects
```sql
- id (UUID, PK)
- client_id (FK → clients)
- name
- description
- status (draft, active, completed, cancelled)
- start_date
- end_date
- budget (decimal)
- owner_id (FK → users)
- created_at
- updated_at
```

**Relations:**
- client (Client)
- owner (User)
- tasks[]

---

### tasks
```sql
- id (UUID, PK)
- project_id (FK → projects, CASCADE nullable)
- title
- description
- status (todo, in_progress, done, cancelled)
- priority (low, medium, high, urgent)
- due_date
- assignee_id (FK → users, nullable)
- created_at
- updated_at
```

---

### notes
```sql
- id (UUID, PK)
- content
- entity_type (client, project, task)
- entity_id (UUID polymorphic)
- created_at
```

---

## 🔧 Prisma Commands

### Development
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name <name>

# Reset database
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

### Production
```bash
# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## 🚀 Usage

### Import Prisma Client
```typescript
import { prisma } from '@/lib/db'

// Example: Get all clients
const clients = await prisma.client.findMany({
  include: {
    projects: true,
    contacts: true,
  },
})
```

### Create Client
```typescript
const client = await prisma.client.create({
  data: {
    name: 'Dior',
    email: 'contact@dior.com',
    company: 'Christian Dior',
    status: 'active',
    createdById: userId,
  },
})
```

### Query with Relations
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    client: true,
    owner: true,
    tasks: {
      include: {
        assignee: true,
      },
    },
  },
})
```

---

## 🔐 Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
```

**⚠️ Never commit .env.local to git!**

---

## 📈 Future Enhancements

**Phase 2:**
- [ ] Files/Documents table
- [ ] Invoices/Billing
- [ ] Time tracking
- [ ] Email integration
- [ ] Activity audit log

**Phase 3:**
- [ ] Notifications table
- [ ] Settings/Preferences
- [ ] Webhooks
- [ ] API keys management

---

**Status:** ✅ Schema deployed  
**Tables:** 6  
**Last migration:** 2026-02-10 (init)
