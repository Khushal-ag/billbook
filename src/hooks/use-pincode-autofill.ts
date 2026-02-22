import { useEffect } from "react";
import type { FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { fetchPostalOffice } from "@/lib/pincode";

type AddressFields = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

export function usePincodeAutofill<T extends FieldValues & AddressFields>(
  postalCode: string | number | undefined,
  countryCode: string | undefined,
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
) {
  const stateKey = "state" as Path<T>;
  const cityKey = "city" as Path<T>;
  const addressKey = "address" as Path<T>;

  useEffect(() => {
    const rawCode = (postalCode ?? "").toString().trim();
    const numericCode = rawCode.replace(/\D/g, "");

    if (numericCode.length !== 6) return;

    const controller = new AbortController();

    const fetchAddress = async () => {
      try {
        const office = await fetchPostalOffice(numericCode, countryCode, controller.signal);
        if (!office) return;

        const currentState = getValues(stateKey);
        const currentCity = getValues(cityKey);
        const currentAddress = getValues(addressKey);

        if (!currentState && office.state) {
          setValue(stateKey, office.state as T[Path<T>], { shouldDirty: true });
        }
        if (!currentCity && office.district) {
          setValue(cityKey, office.district as T[Path<T>], { shouldDirty: true });
        }
        if (!currentAddress) {
          const addressValue = [office.name, office.block || office.district]
            .filter(Boolean)
            .join(", ");
          if (addressValue) {
            setValue(addressKey, addressValue as T[Path<T>], { shouldDirty: true });
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    };

    fetchAddress();
    return () => controller.abort();
  }, [postalCode, countryCode, getValues, setValue]);
}
