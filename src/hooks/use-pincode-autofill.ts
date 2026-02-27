import { useEffect, useRef } from "react";
import type { FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { fetchPostalOffice } from "@/lib/pincode";

type AddressFields = {
  area?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
};

export function usePincodeAutofill<T extends FieldValues & AddressFields>(
  pincode: string | number | undefined,
  countryCode: string | undefined,
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
) {
  const areaKey = "area" as Path<T>;
  const countryKey = "country" as Path<T>;
  const stateKey = "state" as Path<T>;
  const cityKey = "city" as Path<T>;
  const lastAutofillRef = useRef<{
    pincode: string | null;
    area?: string | null;
    country?: string | null;
  }>({ pincode: null });

  useEffect(() => {
    const normalizedCountry = (countryCode ?? "IN").toUpperCase();
    const rawCode = (pincode ?? "").toString().trim();

    if (!rawCode) {
      lastAutofillRef.current = { pincode: null };
      return;
    }

    let lookupCode: string;

    if (normalizedCountry === "IN") {
      const numericCode = rawCode.replace(/\D/g, "");
      if (numericCode.length !== 6) {
        lastAutofillRef.current = { pincode: null };
        return;
      }
      lookupCode = numericCode;
    } else {
      // For non-Indian postcodes, allow alphanumeric and trigger after a few characters
      if (rawCode.length < 4) {
        lastAutofillRef.current = { pincode: null };
        return;
      }
      lookupCode = rawCode;
    }

    const controller = new AbortController();

    const fetchAddress = async () => {
      try {
        const office = await fetchPostalOffice(lookupCode, normalizedCountry, controller.signal);
        if (!office) return;

        const isNewPincode = lastAutofillRef.current.pincode !== lookupCode;
        const currentArea = getValues(areaKey);
        const currentCountry = getValues(countryKey);
        const currentState = getValues(stateKey);
        const currentCity = getValues(cityKey);

        const lastArea = lastAutofillRef.current.area ?? null;
        const lastCountry = lastAutofillRef.current.country ?? null;
        const isFirstAutofill = lastAutofillRef.current.pincode === null;

        // Area/country: if pincode changed, update when it still matches the last autofilled value
        // (or is empty). This avoids clobbering manual edits.
        if (office.country) {
          const shouldUpdateCountry =
            !currentCountry ||
            (isNewPincode && (isFirstAutofill || (lastCountry && currentCountry === lastCountry)));
          if (shouldUpdateCountry) {
            setValue(countryKey, office.country as T[Path<T>], { shouldDirty: true });
          }
        }

        if (office.name) {
          const shouldUpdateArea =
            !currentArea ||
            (isNewPincode && (isFirstAutofill || (lastArea && currentArea === lastArea)));
          if (shouldUpdateArea) {
            setValue(areaKey, office.name as T[Path<T>], { shouldDirty: true });
          }
        }

        // If pincode changed, overwrite city/state (these fields are treated as auto-filled).
        if ((isNewPincode || !currentState) && office.state) {
          setValue(stateKey, office.state as T[Path<T>], { shouldDirty: true });
        }
        if ((isNewPincode || !currentCity) && office.district) {
          setValue(cityKey, office.district as T[Path<T>], { shouldDirty: true });
        }

        if (office.state || office.district || office.name || office.country) {
          lastAutofillRef.current = {
            pincode: lookupCode,
            area: office.name ?? null,
            country: office.country ?? null,
          };
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    };

    fetchAddress();
    return () => controller.abort();
  }, [pincode, countryCode, getValues, setValue]);
}
