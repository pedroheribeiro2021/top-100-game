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

  where(field: string, _op: '==', value: unknown): InMemoryQuery {
    return new InMemoryQuery(this.docs, [(data) => data[field] === value]);
  }
}

type QueryFilter = (data: DocData) => boolean;

class InMemoryQuery {
  constructor(
    private docs: Map<string, DocData>,
    private filters: QueryFilter[],
    private limitCount?: number,
  ) {}

  where(field: string, _op: '==', value: unknown): InMemoryQuery {
    return new InMemoryQuery(
      this.docs,
      [...this.filters, (data) => data[field] === value],
      this.limitCount,
    );
  }

  limit(count: number): InMemoryQuery {
    return new InMemoryQuery(this.docs, this.filters, count);
  }

  async get(): Promise<InMemoryQuerySnapshot> {
    let entries = Array.from(this.docs.entries()).filter(([, data]) =>
      this.filters.every((filter) => filter(data)),
    );

    if (this.limitCount !== undefined) {
      entries = entries.slice(0, this.limitCount);
    }

    const docs = entries.map(([id, data]) => ({ id, data: () => data }));
    return { empty: docs.length === 0, docs };
  }
}

interface InMemoryQuerySnapshot {
  empty: boolean;
  docs: { id: string; data: () => DocData }[];
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

// Sem concorrencia real de threads no Node: a transacao so precisa expor a
// mesma API (get/update) usada pelo client real do Firestore.
class InMemoryTransaction {
  async get(docRef: InMemoryDoc): Promise<InMemoryDocSnapshot> {
    return docRef.get();
  }

  update(docRef: InMemoryDoc, data: Partial<DocData>): void {
    void docRef.update(data);
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
  runTransaction: <T>(
    updateFunction: (transaction: InMemoryTransaction) => Promise<T>,
  ): Promise<T> => updateFunction(new InMemoryTransaction()),
};

// For type compatibility with existing code
export const admin = {
  firestore: () => db,
};
