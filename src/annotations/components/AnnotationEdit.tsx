import * as React from 'react'
import styled from 'styled-components'

import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import TagInput from 'src/tags/ui/tag-input'

export interface AnnotationEditEventProps {
    onEditConfirm: (url: string) => void
    onCommentChange: (comment: string) => void
    setTagInputActive: (active: boolean) => void
    updateTags: PickerUpdateHandler
    deleteSingleTag: (tag: string) => void
}

export interface AnnotationEditGeneralProps {
    isTagInputActive: boolean
    comment: string
    tags: string[]
}

export interface Props
    extends AnnotationEditEventProps,
        AnnotationEditGeneralProps {
    tagPickerDependencies: GenericPickerDependenciesMinusSave
    url: string
    rows: number
}

class AnnotationEdit extends React.Component<Props> {
    private handleTagInputKeydown: React.KeyboardEventHandler = (e) => {
        // Only check for `Tab` and `Shift + Tab`, handle rest of the events normally.
        if (e.key === 'Tab') {
            this.props.setTagInputActive(false)
        }
    }

    private onEnterSaveHandler = {
        test: (e: React.KeyboardEvent<HTMLTextAreaElement>) =>
            (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: (e: React.KeyboardEvent<HTMLTextAreaElement>) =>
            this.props.onEditConfirm(this.props.url),
    }

    private renderInput() {
        return (
            <StyledTextArea
                value={this.props.comment}
                onClick={() => this.props.setTagInputActive(false)}
                placeholder="Add a private note... (save with cmd/ctrl+enter)"
                onChange={(e) => this.props.onCommentChange(e.target.value)}
                onKeyDown={(e) => {
                    if (this.onEnterSaveHandler.test(e)) {
                        this.onEnterSaveHandler.handle(e)
                    }
                }}
            />
        )
    }

    private renderTagInput() {
        const {
            loadDefaultSuggestions,
            queryEntries,
        } = this.props.tagPickerDependencies

        return (
            <TagInput
                deleteTag={this.props.deleteSingleTag}
                queryTagSuggestions={queryEntries}
                fetchInitialTagSuggestions={loadDefaultSuggestions}
                onKeyDown={this.handleTagInputKeydown}
                handleClose={() => this.props.setTagInputActive(false)}
                {...this.props}
            />
        )
    }

    render() {
        return (
            <>
                {this.renderInput()}
                {this.renderTagInput()}
            </>
        )
    }
}

export default AnnotationEdit

const StyledTextArea = styled.textarea`
    background-color: #f7f7f7;
    box-sizing: border-box;
    resize: vertical;
    font-weight: 400;
    font-size: 14px;
    color: #222;
    font-family: 'Poppins', sans-serif;
    border-radius: 3px;
    border: none;
    padding: 10px 7px;
    margin: 5px 10px 5px 10px;

    &::placeholder {
        color: #3a2f45;
    }

    &:focus {
        outline: none;
        box-shadow: none;
        border: none;
    }

    min-height: 100px;
`
