/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import System from "@ff/graph/System";

import { customElement, property, PropertyValues } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

import NItem from "../../explorer/nodes/NItem";
import CPresentationManager, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CPresentationManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-list")
class ItemList extends List<NItem>
{
    @property({ attribute: false })
    system: System = null;

    protected manager: CPresentationManager = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-scrollable", "sv-item-list");

        this.manager = this.system.components.safeGet(CPresentationManager);
    }

    protected connected()
    {
        super.connected();

        this.manager.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.on<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected disconnected()
    {
        this.manager.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.off<IActiveItemEvent>("active-item", this.onActiveItem, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.manager.items;
        return super.update(props);
    }

    protected renderItem(node: NItem)
    {
        return node.displayName;
    }

    protected isItemSelected(node: NItem): boolean
    {
        return node === this.manager.activeItem;
    }

    protected onClickItem(event: MouseEvent, node: NItem)
    {
        this.manager.activeItem = node;
    }

    protected onClickEmpty()
    {
        this.manager.activeItem = null;
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
        this.requestUpdate();
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        if (event.previous) {
            this.setSelected(event.previous, false);
        }
        if (event.next) {
            this.setSelected(event.next, true);
        }
    }

}