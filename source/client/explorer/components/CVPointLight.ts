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

import CPointLight from "@ff/scene/components/CPointLight";

import { IDocument, INode, ILight, ColorRGB } from "common/types/document";

import { ICVLight } from "./CVLight";

////////////////////////////////////////////////////////////////////////////////

export default class CVPointLight extends CPointLight implements ICVLight
{
    static readonly typeName: string = "CVPointLight";

    fromDocument(document: IDocument, node: INode)
    {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];

        if (data.type !== "point") {
            throw new Error("light type mismatch: not a point light");
        }

        this.ins.copyValues({
            color: data.color !== undefined ? data.color : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1,
        });
    }

    toDocument(document: IDocument, node: INode)
    {
        const ins = this.ins;

        const data = {
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value,
            point: {
                distance: ins.distance.value,
                decay: ins.decay.value,
            },
        } as ILight;

        data.type = "point";

        const index = document.lights.length;
        document.lights.push(data);
        node.light = index;
    }
}