#!/usr/bin/env python3
import getopt, argparse, json, requests, time

def get_data(uuid):
    try:
        proj_url = f"https://api.ingest.archive.data.humancellatlas.org/projects/search/findByUuid?uuid={uuid}"
        print(f"Getting project from {proj_url}")
        proj = requests.get(proj_url).json()
    
        # TODO When retrieving this info in the UI make sure that it is agnostic to thet data format as this just pulls info but when switching to using API will use schema
        desired_content_keys = ["project_core", "contributors", "array_express_accessions", "insdc_project_accessions", "publications"]
        
        return {
            "added_to_index": int(time.time()),
            "content": {k: proj["content"].get(k, None) for k in desired_content_keys},
            "uuid": uuid
        }
    except:
        raise Exception("Something went wrong. Is this a valid project UUID?")

def get_uuids(input_file):
    with open(input_file, "r") as file:
        return file.read().splitlines()

def make_ae_links(proj):
    try:
        return [f"https://identifiers.org/arrayexpress:{acc}" for acc in proj["content"]['array_express_accessions']]
    except KeyError:
        return []

def make_ena_links(proj):
    try:
        return [f"https://identifiers.org/ena.embl:{acc}" for acc in proj["content"]['insdc_project_accessions']]
    except KeyError:
        return []

def make_pub_links(proj):
    try:
        doi_list = [x['doi'] for x in proj["content"]['publications']]
        return [f"https://doi.org/{doi}" for doi in doi_list]
    except KeyError:
        return []


def make_dcp_link(prj_uuid):
    catalog = "dcp2"
    azul_proj_url = "https://service.azul.data.humancellatlas.org/index/projects/{}?catalog={}".format(prj_uuid, catalog)
    if requests.get(azul_proj_url):
        return "https://data.humancellatlas.org/explore/projects/{}?catalog={}".format(prj_uuid, catalog)
    else:
        return ""


if __name__ == "__main__":
    description = "Scrape Ingest API for published projects data."
    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("-i", "--input", help="File containing a list of UUIDs to scrape. Each UUID must be on a new line.", default="published_uuids.txt")
    parser.add_argument("-o", "--output", help="Output JSON file", default="data.json")

    args = parser.parse_args()

    uuids = get_uuids(args.input)

    with open(args.output, 'r+') as out:
        existing_data = json.load(out) or []
        # Use a hashmap to ensure no duplicates but allow updates
        hashmap = { x["uuid"] : x for x in existing_data}
        out.seek(0)
        
        for uuid in uuids:
            old_timestamp = None
            if uuid in hashmap and "added_to_index" in hashmap[uuid]:
                print(f"{uuid} already in data, updating...")
                old_timestamp = hashmap[uuid]["added_to_index"]

            hashmap[uuid] = get_data(uuid)

            if old_timestamp:
                hashmap[uuid]["added_to_index"] = old_timestamp

        for uuid in list(hashmap.keys()):
            if uuid not in uuids:
                print(f"Removing {uuid} from data...")
                del hashmap[uuid]
        
        json.dump(list(hashmap.values()), out, indent=4)
        out.truncate()