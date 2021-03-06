import styled from 'styled-components'

export const HoverBox = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: visible;
    position: absolute;
    border-radius: 3px;
    width: 300px;
    background-color: #fff;
    border-radius: 3px;
`

export const HoverBoxDashboard = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: visible;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    border-radius: 3px;
    right: 20px;
    top: 50px;
`
