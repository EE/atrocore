<?php
/*
 * This file is part of EspoCRM and/or AtroCore.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2019 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: http://www.espocrm.com
 *
 * AtroCore is EspoCRM-based Open Source application.
 * Copyright (C) 2020 AtroCore UG (haftungsbeschränkt).
 * Website: https://treolabs.com
 *
 * AtroCore as well as EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AtroCore as well as EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word
 * and "AtroCore" word.
 */

declare(strict_types=1);

namespace Treo\Core\Loaders;

use Espo\Core\AclManager;
use Espo\Entities\User;

/**
 * Class Acl
 *
 * @author rr@atrocore.com
 */
class Acl extends Base
{
    /**
     * Load Acl
     *
     * @return mixed
     */
    public function load()
    {
        if (!empty($this->getContainer()->get('portal'))) {
            return new \Espo\Core\Portal\Acl($this->getAclManager(), $this->getUser());
        }

        return new \Espo\Core\Acl($this->getAclManager(), $this->getUser());
    }

    /**
     * Get acl manager
     *
     * @return AclManager
     */
    protected function getAclManager()
    {
        return $this->getContainer()->get('aclManager');
    }

    /**
     * Get user
     *
     * @return User
     */
    protected function getUser()
    {
        return $this->getContainer()->get('user');
    }
}
