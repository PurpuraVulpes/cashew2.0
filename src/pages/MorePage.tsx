import { useRef } from 'react'
import type { ThemeMode } from '../types'
import { CURRENCIES } from '../data/currencies'
import { ACCENTS } from '../data/accents'
import { useSheets } from '../store/SheetsContext'
import { useStore } from '../store/StoreContext'
import { sortedSubs, walletBalance } from '../utils/calc'
import { todayISO } from '../utils/dates'
import { formatMoney } from '../utils/money'
import { toast } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { Segmented, Select } from '../components/Controls'
import { SubRow } from '../components/SubRow'

export function MorePage() {
  const {
    data,
    setSettings,
    loadDemo,
    clearAll,
    exportData,
    importData,
    paySubscription,
  } = useStore()
  const { open } = useSheets()
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashew2-sauvegarde-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Sauvegarde téléchargée 💾')
  }

  const onImportFile = async (file: File) => {
    const text = await file.text()
    const ok = await confirm({
      title: 'Importer cette sauvegarde ?',
      message: 'Les données actuelles seront remplacées.',
      confirmLabel: 'Importer',
      danger: true,
    })
    if (!ok) return
    if (importData(text)) toast('Données importées ✓')
    else toast('Fichier invalide')
  }

  return (
    <div className="page-body">
      <header className="page-head">
        <h1>Plus</h1>
      </header>

      {/* Apparence */}
      <section className="card">
        <h2 className="card-title">🎨 Apparence</h2>
        <Segmented
          value={data.settings.theme}
          onChange={(v) => setSettings({ theme: v as ThemeMode })}
          options={[
            { value: 'light', label: '☀️ Clair' },
            { value: 'dark', label: '🌙 Sombre' },
            { value: 'system', label: '⚙️ Système' },
          ]}
        />
        <div className="field" style={{ marginTop: 14 }}>
          <span className="field-label">Couleur d’accent</span>
          <div className="accent-row">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`accent-swatch ${data.settings.accent === a.id ? 'active' : ''}`}
                data-accent-id={a.id}
                onClick={() => setSettings({ accent: a.id })}
                aria-label={a.label}
                title={a.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Général */}
      <section className="card">
        <h2 className="card-title">🌍 Général</h2>
        <p className="field-hint">Devise principale des totaux (conversion indicative des autres devises).</p>
        <Select
          value={data.settings.currency}
          onChange={(v) => setSettings({ currency: v })}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
        />
      </section>

      {/* Portefeuilles */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">👛 Portefeuilles</h2>
          <button className="link-btn" onClick={() => open({ kind: 'wallet' })}>
            + Ajouter
          </button>
        </div>
        <div className="list">
          {data.wallets.map((w) => (
            <button key={w.id} className="settings-row" onClick={() => open({ kind: 'wallet', wallet: w })} type="button">
              <span className="dot big" style={{ background: w.color }} />
              <span className="row-name">{w.name}</span>
              <span className="row-value">
                {formatMoney(walletBalance(data, w.id), w.currency, 0)}
                <span className="muted"> · {w.currency}</span>
              </span>
              <span className="chevron">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* Catégories */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">🏷️ Catégories</h2>
          <button className="link-btn" onClick={() => open({ kind: 'category' })}>
            + Ajouter
          </button>
        </div>
        <div className="chips wrap">
          {data.categories.map((c) => (
            <button key={c.id} className="chip" onClick={() => open({ kind: 'category', category: c })} type="button">
              <span className="chip-dot" style={{ background: c.color }} />
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Abonnements */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">🔁 Abonnements</h2>
          <button className="link-btn" onClick={() => open({ kind: 'subscription' })}>
            + Ajouter
          </button>
        </div>
        {data.subscriptions.length === 0 ? (
          <p className="muted">Suivez vos charges récurrentes (Netflix, forfait, sport…).</p>
        ) : (
          <div className="list">
            {sortedSubs(data).map((sub) => (
              <SubRow
                key={sub.id}
                sub={sub}
                onEdit={() => open({ kind: 'subscription', sub })}
                onPay={() => {
                  paySubscription(sub.id)
                  toast(`${sub.title} payé ✓`)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Données */}
      <section className="card">
        <h2 className="card-title">💾 Données</h2>
        <p className="field-hint">Vos données restent sur cet appareil (stockage local du navigateur).</p>
        <div className="btn-col">
          <button className="btn btn-ghost" onClick={doExport}>
            ⬇️ Exporter une sauvegarde (JSON)
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆️ Importer une sauvegarde
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onImportFile(f)
              e.target.value = ''
            }}
          />
          <button
            className="btn btn-ghost"
            onClick={async () => {
              const ok = await confirm({
                title: 'Charger les données de démonstration ?',
                message: 'Les données actuelles seront remplacées par la démo.',
                confirmLabel: 'Charger la démo',
              })
              if (ok) {
                loadDemo()
                toast('Données de démonstration chargées 🌰')
              }
            }}
          >
            🎁 Charger la démonstration
          </button>
          <button
            className="btn btn-danger-ghost"
            onClick={async () => {
              const ok = await confirm({
                title: 'Tout effacer ?',
                message: 'Transactions, budgets, abonnements et portefeuilles seront supprimés.',
                confirmLabel: 'Tout effacer',
                danger: true,
              })
              if (ok) {
                clearAll()
                toast('Données effacées')
              }
            }}
          >
            🗑️ Effacer toutes les données
          </button>
        </div>
      </section>

      {/* À propos */}
      <section className="card about-card">
        <span className="brand-logo big">🌰</span>
        <strong>Cashew 2.0</strong>
        <p className="muted">
          Suivi de dépenses inspiré de Cashew — budgets, abonnements, multi-devises, thème sombre.
          Application de démonstration : vos données restent en local.
        </p>
      </section>
    </div>
  )
}
