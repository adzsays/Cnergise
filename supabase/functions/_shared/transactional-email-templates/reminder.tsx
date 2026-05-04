import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Cnergise'

interface ReminderProps {
  title?: string
  description?: string
  remindAt?: string
  sourceType?: string
}

const ReminderEmail = ({ title, description, remindAt, sourceType }: ReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'You have an upcoming reminder'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{title || 'Reminder'}</Heading>
        {sourceType && <Text style={tag}>{sourceType.toUpperCase()}</Text>}
        {description && <Text style={text}>{description}</Text>}
        {remindAt && (
          <Section style={card}>
            <Text style={cardLabel}>When</Text>
            <Text style={cardValue}>{new Date(remindAt).toLocaleString()}</Text>
          </Section>
        )}
        <Text style={footer}>Sent by {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReminderEmail,
  subject: (d: Record<string, any>) => d?.title ? `Reminder: ${d.title}` : 'Your Cnergise reminder',
  displayName: 'Reminder',
  previewData: {
    title: 'Quarterly review meeting',
    description: 'Conference room A · Bring slides',
    remindAt: new Date().toISOString(),
    sourceType: 'event',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px' }
const tag = { fontSize: '11px', fontWeight: 'bold', color: '#0d9488', letterSpacing: '0.5px', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const card = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', margin: '12px 0 24px' }
const cardLabel = { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const cardValue = { fontSize: '14px', color: '#0f172a', fontWeight: 600, margin: '0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }
