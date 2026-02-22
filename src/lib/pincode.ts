export type PincodeOffice = {
  name?: string;
  district?: string;
  state?: string;
  block?: string;
};

type PincodeResponse = {
  Status?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
    Block?: string;
  }>;
};

export async function fetchPostalOffice(code: string, countryCode?: string, signal?: AbortSignal) {
  const normalizedCountry = (countryCode ?? "IN").toUpperCase();

  if (normalizedCountry === "IN") {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, { signal });
    const data = (await res.json()) as PincodeResponse[];
    const entry = data?.[0];
    if (!entry || entry.Status !== "Success") return null;
    const office = entry.PostOffice?.[0];
    if (!office) return null;

    return {
      name: office.Name,
      district: office.District,
      state: office.State,
      block: office.Block,
    } satisfies PincodeOffice;
  }

  const res = await fetch(`https://api.zippopotam.us/${normalizedCountry}/${code}`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: Array<{
      "place name"?: string;
      state?: string;
      county?: string;
    }>;
  };
  const place = data.places?.[0];
  if (!place) return null;

  return {
    name: place["place name"],
    district: place.county ?? place["place name"],
    state: place.state,
  } satisfies PincodeOffice;
}
