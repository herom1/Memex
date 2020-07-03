import * as React from 'react'
import styled from 'styled-components'

import niceTime from 'src/util/nice-time'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
// import { CrowdfundingBox } from 'src/common-ui/crowdfunding'
import AnnotationView from 'src/annotations/components/AnnotationView'
import AnnotationEdit from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

export interface AnnotationEditableGeneralProps {
    // displayCrowdfunding: boolean
    env: 'inpage' | 'overview'
}

export interface AnnotationEditableProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    url: string
    className?: string
    isActive?: boolean
    isHovered?: boolean
    createdWhen: number
    lastEdited: number
    body?: string
    comment?: string
    tags: string[]
    hasBookmark?: boolean
    mode: AnnotationMode
    tagPickerDependencies: GenericPickerDependenciesMinusSave
}

export interface AnnotationEditableEventProps {
    handleGoToAnnotation: (url: string) => void
    handleMouseEnter?: (url: string) => void
    handleMouseLeave?: (url: string) => void
    handleConfirmDelete: (url: string) => void
    handleCancelDelete: (url: string) => void
    handleEditBtnClick: (url: string) => void
    handleTrashBtnClick: (url: string) => void
    handleBookmarkToggle: (url: string) => void
    handleAnnotationTagClick: (url: string, tag: string) => void
    handleConfirmAnnotationEdit: (props: {
        url: string
        comment: string
        tags: string[]
    }) => void
}

export type Props = AnnotationEditableGeneralProps &
    AnnotationEditableProps &
    AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private _boxRef: HTMLDivElement = null
    private removeEventListeners?: () => void

    componentDidMount() {
        this._setupEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private get isEdited() {
        return (
            this.props.lastEdited &&
            this.props.lastEdited !== this.props.createdWhen
        )
    }

    private get isClickable() {
        return this.props.body && this.props.env !== 'overview'
    }

    private _setupEventListeners = () => {
        if (this._boxRef) {
            const handleMouseEnter = () =>
                this.props.handleMouseEnter(this.props.url)
            const handleMouseLeave = () =>
                this.props.handleMouseLeave(this.props.url)

            this._boxRef.addEventListener('mouseenter', handleMouseEnter)
            this._boxRef.addEventListener('mouseleave', handleMouseLeave)

            this.removeEventListeners = () => {
                this._boxRef.removeEventListener('mouseenter', handleMouseEnter)
                this._boxRef.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }

    private _removeEventListeners = () => {
        if (this._boxRef && this.removeEventListeners) {
            this.removeEventListeners()
        }
    }

    private _getFormattedTimestamp = () =>
        niceTime(this.props.lastEdited ?? this.props.createdWhen)

    private _getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string } = (text) => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280)
            return {
                isTextTooLong: true,
                text: truncatedText,
            }
        }

        for (let i = 0, newlineCount = 0; i < text.length; ++i) {
            if (text[i] === '\n') {
                newlineCount++
                if (newlineCount > 4) {
                    const truncatedText = text.slice(0, i)
                    return {
                        isTextTooLong: true,
                        text: truncatedText,
                    }
                }
            }
        }

        return {
            isTextTooLong: false,
            text,
        }
    }

    private _handleEditAnnotation = (args: {
        comment: string
        tags: string[]
    }) => {
        const { url } = this.props
        this.props.handleConfirmAnnotationEdit({ url, ...args })
    }

    private _handleGoToAnnotation = () => {
        if (!this.isClickable) {
            return
        }

        this.props.handleGoToAnnotation(this.props.url)
    }

    private _handleConfirmDelete = () => {
        this.props.handleConfirmDelete(this.props.url)
    }

    private _handleEditIconClick = () => {
        this.props.handleEditBtnClick(this.props.url)
    }

    private _handleTrashIconClick = () => {
        this.props.handleTrashBtnClick(this.props.url)
    }

    private _handleShareIconClick = () => {
        // TODO: what does this do?
    }

    private _handleCancelDelete = () => {
        this.props.handleCancelDelete(this.props.url)
    }

    private _handleBookmarkToggle = () => {
        this.props.handleBookmarkToggle(this.props.url)
    }

    private _setBoxRef = (ref: HTMLDivElement) => {
        this._boxRef = ref
    }

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        return (
            <HighlightStyled>
                <HighlightTextStyled>
                    <TextTruncated
                        text={this.props.body}
                        getTruncatedTextObject={this._getTruncatedTextObject}
                    />
                </HighlightTextStyled>
            </HighlightStyled>
        )
    }

    private renderMainAnnotation() {
        if (this.props.mode === 'edit') {
            return (
                <AnnotationEdit
                    {...this.props}
                    rows={2}
                    handleConfirmEdit={this._handleEditAnnotation}
                    handleCancelEdit={this._handleCancelDelete}
                />
            )
        }

        return (
            <AnnotationView
                {...this.props}
                isEdited={this.isEdited}
                timestamp={this._getFormattedTimestamp()}
                hasBookmark={!!this.props.hasBookmark}
                editIconClickHandler={this._handleEditIconClick}
                handleGoToAnnotation={this._handleGoToAnnotation}
                handleBookmarkToggle={this._handleBookmarkToggle}
                trashIconClickHandler={this._handleTrashIconClick}
                shareIconClickHandler={this._handleShareIconClick}
                handleCancelDelete={this._handleCancelDelete}
                handleConfirmDelete={this._handleConfirmDelete}
                getTruncatedTextObject={this._getTruncatedTextObject}
                handleTagClick={(tag) =>
                    this.props.handleAnnotationTagClick(this.props.url, tag)
                }
            />
        )
    }

    render() {
        // if (this.props.displayCrowdfunding) {
        //     return (
        //         <CrowdfundingBox
        //             onClose={() => console.log('close')}
        //         />
        //     )
        // }

        return (
            <AnnotationStyled
                id={this.props.url} // Focusing on annotation relies on this ID.
                ref={this._setBoxRef}
                onClick={this._handleGoToAnnotation}
            >
                {this.renderHighlightBody()}
                {this.renderMainAnnotation()}
            </AnnotationStyled>
        )
    }
}

const HighlightTextStyled = styled.span`
    background-color: #00d88b;
    padding: 2px 0;
    line-height: 25px;
    font-style: normal;
    color: #3a2f45;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    padding: 15px 15px 7px 15px;
    line-height: 20px;
    text-align: left;
`

const AnnotationStyled = styled.div`
    border-radius: 3px;

    color: rgb(54, 54, 46);

    border-radius: radius3;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    transition: background 120ms ease-in 0s;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }

    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    margin: 10px 0 5px 0;
    cursor: pointer;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);

    ${(props: Props) =>
        props.isActive &&
        `
        box-shadow: 0px 0px 5px 1px #00000080;
    `}

    ${(props: Props) =>
        props.body &&
        props.env === 'overview' &&
        `
        cursor: pointer;
    `}

    ${(props: Props) =>
        props.mode === 'edit' &&
        `
        background-color: white;
        cursor: default;
    `}
`