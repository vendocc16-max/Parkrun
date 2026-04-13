type GenericRelationship = { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }
type GenericTable = { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: GenericRelationship[] }
type GenericView = { Row: Record<string, unknown>; Relationships: GenericRelationship[] }
type GenericFunction = { Args: Record<string, unknown> | never; Returns: unknown }
type GenericSchema = { Tables: Record<string, GenericTable>; Views: Record<string, GenericView>; Functions: Record<string, GenericFunction> }

// Test Views
type T1 = Record<string, never> extends Record<string, GenericView> ? 'YES' : 'NO'

// Test Tables (simplified)
type SimpleTable = { Row: { id: string }; Insert: { id?: string }; Update: { id?: string }; Relationships: [] }
type T2 = { sessions: SimpleTable } extends Record<string, GenericTable> ? 'YES' : 'NO'

// Test consents with Update: never
type ConsentTable = { Row: { id: string }; Insert: { id?: string }; Update: never; Relationships: [] }
type T3 = { consents: ConsentTable } extends Record<string, GenericTable> ? 'YES' : 'NO'

// Test if Record<string, never> is the issue with Views
type T4 = {} extends Record<string, GenericView> ? 'YES' : 'NO'

declare const t1: T1
declare const t2: T2
declare const t3: T3
declare const t4: T4
