"use client";

import { Check, CircleHelp, ExternalLink, Footprints, MapPin, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MosqueRow, PlacePicker, allMosques, findMosque } from "@/components/shared";
import { Badge, Button, ButtonLink, Card, LoadingPage, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { fetchNearbyMosques } from "@/lib/osm";
import { distanceBand, distanceKm, nearestMosques, walkingMinutes } from "@/lib/places";
import { cacheMosques, useAppState } from "@/lib/store";

export function MosquesView() {
  const state = useAppState();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!state) return <LoadingPage />;

  const { place } = state;
  const list = nearestMosques(place, allMosques(state), 15);

  async function loadReal() {
    setLoading(true);
    setMessage(null);
    try {
      const found = await fetchNearbyMosques(place.lat, place.lng, place.label);
      cacheMosques(found);
      setMessage(found.length ? `Found ${found.length} mosques within 3 km from OpenStreetMap.` : "No mosques found within 3 km on OpenStreetMap.");
    } catch {
      setMessage("Couldn't reach OpenStreetMap right now. Showing sample mosques instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Mosques near you" subtitle="Sorted by distance. Tap one to see what to expect." />
      <div className="mb-3">
        <PlacePicker place={place} />
      </div>
      <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Sample mosques keep the demo working offline. Load real ones near {place.label} from OpenStreetMap.</p>
        <Button variant="secondary" onClick={loadReal} disabled={loading} className="shrink-0">
          <MapPin className="h-4 w-4" /> {loading ? "Searching…" : "Find real mosques"}
        </Button>
      </Card>
      {message && (
        <div className="mb-4" role="status">
          <Notice tone="brand">{message}</Notice>
        </div>
      )}
      <Card className="space-y-2">
        {list.map(({ mosque }) => (
          <MosqueRow key={mosque.id} mosque={mosque} from={place} href={`/mosques/${mosque.id}`} />
        ))}
      </Card>
    </div>
  );
}

function Facility({ label, value }: { label: string; value: boolean | null }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span>{label}</span>
      {value === true ? (
        <span className="inline-flex items-center gap-1 text-sm text-brand">
          <Check className="h-4 w-4" /> Yes
        </span>
      ) : value === false ? (
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <X className="h-4 w-4" /> No
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <CircleHelp className="h-4 w-4" /> Not verified yet
        </span>
      )}
    </li>
  );
}

export function MosqueDetailView() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  if (!state) return <LoadingPage />;
  const mosque = findMosque(state, decodeURIComponent(id));
  if (!mosque) {
    return (
      <Card className="text-center">
        <p className="font-semibold">We couldn&apos;t find that mosque.</p>
        <ButtonLink href="/mosques" variant="secondary" className="mt-3">
          Back to mosques
        </ButtonLink>
      </Card>
    );
  }
  const km = distanceKm(state.place, mosque);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mosque.lat},${mosque.lng}`;

  return (
    <div>
      <Link href="/mosques" className="text-sm font-medium text-brand">
        ← All mosques
      </Link>
      <div className="mt-3">
        <PageHeader
          title={mosque.name}
          subtitle={
            <span className="inline-flex flex-wrap items-center gap-2">
              {mosque.area} · {distanceBand(km)}
              {mosque.source === "sample" ? <Badge>Sample data</Badge> : <Badge tone="brand">OpenStreetMap</Badge>}
            </span>
          }
        />
      </div>

      <Card className="bg-brand-soft">
        <p className="font-semibold">Nervous about going? You don&apos;t have to go alone.</p>
        <p className="mt-1 text-sm text-muted">See who&apos;s already going to {mosque.name} and ask one of them to meet you at the door.</p>
        <ButtonLink href={`/companion?mosque=${encodeURIComponent(mosque.id)}`} className="mt-3">
          <Users className="h-4 w-4" /> Go with a companion
        </ButtonLink>
      </Card>

      <SectionTitle>Getting there</SectionTitle>
      <Card className="space-y-3">
        {km < 3 && (
          <p className="flex items-center gap-2 text-sm">
            <Footprints className="h-4 w-4 text-brand" /> About {walkingMinutes(km)} minutes on foot
          </p>
        )}
        <p className="text-sm">
          <span className="text-muted">Usual meeting point: </span>
          {mosque.meetingPoint}
        </p>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          Open in Maps <ExternalLink className="h-4 w-4" />
        </a>
      </Card>

      <SectionTitle>Facilities</SectionTitle>
      <Card>
        <ul className="divide-y divide-line">
          <Facility label="Sisters' prayer area" value={mosque.sistersSection} />
          <Facility label="Wudu area" value={mosque.wuduArea} />
          <Facility label="Parking" value={mosque.parking} />
        </ul>
        <p className="mt-2 text-xs text-muted">In the full app, mosque partners and visitors confirm these and add photos of the entrances.</p>
      </Card>

      <SectionTitle>First time here?</SectionTitle>
      <Card>
        <p className="text-sm text-muted">What to wear, where to put your shoes, and what to do if you don&apos;t know what to do.</p>
        <ButtonLink href="/learn/mosque-etiquette" variant="secondary" className="mt-3">
          Read: Your first visit to the mosque
        </ButtonLink>
      </Card>
    </div>
  );
}
