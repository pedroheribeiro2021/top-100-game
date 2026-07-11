// In-memory database mock for local development
// This replaces Firestore when no credentials are available

type DocData = Record<string, unknown>;

class InMemoryCollection {
  private docs = new Map<string, DocData>();

  doc(id: string) {
    return new InMemoryDoc(this.docs, id);
  }

  async add(data: DocData): Promise<InMemoryDocRef> {
    const id =
      'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.docs.set(id, { ...data, id });
    return { id } as InMemoryDocRef;
  }

  async getAll(): Promise<InMemoryDocRef[]> {
    return Array.from(this.docs.keys()).map((id) => ({
      id,
    })) as InMemoryDocRef[];
  }
}

class InMemoryDoc {
  constructor(
    private docs: Map<string, DocData>,
    private id: string,
  ) {}

  async get(): Promise<InMemoryDocSnapshot> {
    const data = this.docs.get(this.id);
    return { exists: !!data, data: () => data || null } as InMemoryDocSnapshot;
  }

  async set(data: DocData): Promise<void> {
    this.docs.set(this.id, { ...data, id: this.id });
  }

  async update(data: Partial<DocData>): Promise<void> {
    const existing = this.docs.get(this.id);
    if (existing) {
      this.docs.set(this.id, { ...existing, ...data });
    }
  }

  async delete(): Promise<void> {
    this.docs.delete(this.id);
  }
}

interface InMemoryDocRef {
  id: string;
}

interface InMemoryDocSnapshot {
  exists: boolean;
  data: () => DocData | null;
}

// Singleton in-memory database
class InMemoryDB {
  private collections = new Map<string, InMemoryCollection>();
  private static instance: InMemoryDB;

  static getInstance(): InMemoryDB {
    if (!InMemoryDB.instance) {
      InMemoryDB.instance = new InMemoryDB();
    }
    return InMemoryDB.instance;
  }

  collection(name: string): InMemoryCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection());
    }
    return this.collections.get(name)!;
  }

  // Clear all data (useful for testing)
  clear(): void {
    this.collections.clear();
  }
}

// Export a Firestore-like interface
export const db = {
  collection: (name: string) => InMemoryDB.getInstance().collection(name),
};

// For type compatibility with existing code
export const admin = {
  firestore: () => db,
};
