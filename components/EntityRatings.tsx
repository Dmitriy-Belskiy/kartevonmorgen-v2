import React, { FC, Fragment } from 'react'
import { NextRouter, useRouter } from 'next/router'
import toString from 'lodash/toString'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'
import { isWebUri } from 'valid-url'
import moment from 'moment'
import { Button, Comment, Divider, Typography } from 'antd'
import useTranslation from 'next-translate/useTranslation'
import { Rating } from '../dtos/Rating'
import { RatingsRequest } from '../dtos/RatingsRequest'
import useRequest from '../api/useRequest'
import API_ENDPOINTS from '../api/endpoints'
import { RatingComment } from '../dtos/RatingComment'
import produce from 'immer'
import { convertQueryParamToArray } from '../utils/utils'
import { EntrySlugEntity, mapSingularEntityNameToPlural, SlugVerb } from '../utils/types'


const { Title, Link, Text } = Typography


interface EntityCommentsProps {
  ratingsIds: string[]
}


const redirectToNewRatingForm = (router: NextRouter) => () => {
  const { query } = router
  const newQueryParams = produce(query, draftState => {
    const { slug } = draftState
    const slugArray = convertQueryParamToArray(slug)

    slugArray.push(mapSingularEntityNameToPlural[EntrySlugEntity.RATING], SlugVerb.CREATE)
    draftState.slug = slugArray
  })

  router.replace(
    {
      pathname: '/maps/[...slug]',
      query: newQueryParams,
    },
    undefined,
    { shallow: true },
  )
}


const EntityRatings: FC<EntityCommentsProps> = (props) => {
  const { ratingsIds } = props
  const hasRatings = ratingsIds.length !== 0

  const router = useRouter()

  const { t } = useTranslation('map')

  // the hooks should be at the top level before any kind of returns
  // so we have to make have the useRequest any way, but we'll make it conditional
  // to prevent unnecessary calls
  const ratingsRequest: RatingsRequest = {
    ids: toString(ratingsIds),
  }
  const { data: ratings, error: commentsError } = useRequest<Rating[]>(
    hasRatings &&
    {
      url: `${API_ENDPOINTS.getRatings()}/${ratingsRequest.ids}`,
    },
  )

  // has no comment at all
  if (!hasRatings) {
    return null
  }

  if (commentsError) {
    // todo: show error notification
    return null
  }

  // is loading
  if (!ratings) {
    // todo: make an spinner for loading
    return null
  }

  const groupedRatings = groupBy(ratings, 'context')
  const sortedContexts = Object.keys(groupedRatings).sort()

  return (
    <div>
      <Divider>{t('ratings.rating-heading')}</Divider>

      <Button
        type="primary"
        onClick={redirectToNewRatingForm(router)}
        style={{
          width: '100%',
          marginBottom: 16,
        }}
      >
        {t('ratings.newRating')}
      </Button>

      {
        sortedContexts.map((context: string, i: number) => {
          const contextRatings: Rating[] = groupedRatings[context]
          const isLastContext = i === sortedContexts.length - 1

          return (
            <div key={`groupRatings-${context}`}>
              <Title className={context} level={5}>{t(`ratings.contextName.${context}`)}</Title>

              {
                contextRatings.map((contextRating: Rating) => {
                  const [rootComment, ...replies] = contextRating.comments

                  return (
                    <Comment
                      key={`comment-${rootComment.id}`}
                      avatar='https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'
                      content={
                        <Fragment>
                          <Text>{rootComment.text}</Text>

                          {
                            !isEmpty(contextRating.source) &&
                            <Fragment>
                              <Divider type="vertical"/>

                              {
                                isWebUri(contextRating.source) ? (
                                  <Link
                                    href={contextRating.source}
                                    target="_blank"
                                  >
                                    {t('ratings.sourceWebsite')}
                                  </Link>
                                ) : (
                                  <Text type="secondary">{contextRating.source}</Text>
                                )
                              }
                            </Fragment>
                          }
                        </Fragment>
                      }
                      datetime={moment.unix(rootComment.created).fromNow()}
                    >
                      {
                        replies.map((reply: RatingComment) => {
                          return (
                            <Comment
                              key={`comment-${reply.id}`}
                              avatar='https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'
                              content={<Text>{reply.text}</Text>}
                              datetime={moment.unix(reply.created).fromNow()}
                            />
                          )
                        })
                      }
                    </Comment>
                  )
                })
              }

              {
                !isLastContext && (
                  <Divider dashed/>
                )
              }
            </div>
          )
        })
      }
    </div>
  )
}

EntityRatings.defaultProps = {
  ratingsIds: [],
}


export default EntityRatings