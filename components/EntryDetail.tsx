import React, { FC } from 'react'
import { useRouter } from 'next/router'
import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import { Divider, Tag, Typography } from 'antd'
import useRequest from '../api/useRequest'
import { EntryRequest } from '../dtos/EntryRequest'
import { RouterQueryParam, SlugEntity } from '../utils/types'
import { SearchEntryID } from '../dtos/SearchEntry'
import { Entries as EntriesDTO, Entry } from '../dtos/Entry'
import API_ENDPOINTS from '../api/endpoints'
import EntityImage from './EntityImage'
import { types as resultTypes } from './TypeChooser'
import EntryContact from './EntryContact'
import EntryAddress from './EntryAddress'
import EntryTags from './EntryTags'
import EntityComments from './EntityComments'
import EntityFooter from './EntityFooter'
import EntityHeader from './EntityHeader'

const { Title, Paragraph } = Typography


interface EntryDetailProps {
  entryId: SearchEntryID
}


const EntryDetail: FC<EntryDetailProps> = (props) => {
  const { entryId } = props

  // todo: truncate long details
  // const [truncateDetail, setTruncateDetail] = useState(true)

  const router = useRouter()
  const { query, pathname } = router

  const optionalOrgTag: RouterQueryParam = query['org-tag']
  const orgTag = optionalOrgTag && isString(optionalOrgTag) ? optionalOrgTag : null
  const entryRequest: EntryRequest = {
    org_tag: orgTag,
  }

  const { data: entries, error: entriesError } = useRequest<EntriesDTO>({
    url: `${API_ENDPOINTS.getEntries()}/${entryId}`,
    params: entryRequest,
  })

  const foundEntry: boolean = isArray(entries) && entries.length !== 0
  const entry: Entry = foundEntry ? entries[0] : null

  if (entriesError) {
    //  todo: show error notification, redirect to the search result view
    return null
  }

  // still loading
  if (!entries) {
    return null
  }

  if (!foundEntry) {
    //  todo: show not found notification, redirect to the search view
    return null
  }


  const type = resultTypes.find(t => t.id === entry.categories[0])

  return (
    <div>

      <EntityHeader/>

      <EntityImage
        title={entry.title}
        src={entry.image_url}
      />

      <Title level={2}>{entry.title}</Title>

      <Tag color={type.color} style={{ marginBottom: 12 }}>{type.name}</Tag>

      <Paragraph>{entry.description}</Paragraph>

      <Divider>Contact</Divider>

      <EntryContact
        homepage={entry.homepage}
        contact_name={entry.contact_name}
        email={entry.email}
        telephone={entry.telephone}

      />

      <EntryAddress
        city={entry.city}
        country={entry.country}
        state={entry.state}
        street={entry.street}
        zip={entry.zip}
      />

      <Divider>Tags</Divider>

      <EntryTags tags={entry.tags}/>

      <Divider>Comments</Divider>

      <EntityComments ratingsIds={entry.ratings}/>

      <EntityFooter
        entityId={entry.id}
        type={SlugEntity.ENTRY}
        title={entry.title}
        activeLink={pathname}
        created_at={entry.created}
        version={entry.version}
      />

    </div>
  )
}

export default EntryDetail