export default interface PodProvider {
    name: string;
    url: string;
}

export const POD_PROVIDER_ANY = "Any";

export const POD_PROVIDERS: Array<PodProvider> = [
    { name: POD_PROVIDER_ANY, url: "" },
    { name: "Solidcommunity", url: "https://solidcommunity.net/" },
    { name: "Inrupt", url: "https://inrupt.net/" },
    { name: "Solidweb", url: "https://solidweb.org/" }
];